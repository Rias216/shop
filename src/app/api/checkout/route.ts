import { NextResponse } from "next/server";
import { z } from "zod";
import { clearCart, getCart } from "@/lib/cart";
import { db } from "@/lib/db";
import { createPayPalOrder } from "@/lib/payments/paypal";
import {
  assertPayCurrencyAllowed,
  createNowPaymentsInvoice,
} from "@/lib/payments/nowpayments";
import { notifyOrderPlaced, orderPublicUrl } from "@/lib/orders";
import { unitPricePerVialCents } from "@/lib/pricing";
import { resolveCart } from "@/lib/resolve-cart";
import { redeemCoupon, validateCouponCode } from "@/lib/coupons";
import { quoteOrder } from "@/lib/shipping";
import {
  getStoreSettings,
  isNowPaymentsConfigured,
  isCountryBlockedInSettings,
  isPayPalConfigured,
} from "@/lib/settings";
import { createRequestPerf } from "@/lib/perf";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

const checkoutSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().min(1),
  country: z.string().length(2),
  paymentMethod: z.enum(["PAYPAL", "CRYPTO", "MANUAL"]),
  cryptoCurrency: z
    .string()
    .min(2)
    .max(12)
    .regex(/^[a-z0-9]+$/)
    .optional(),
  couponCode: z.string().max(40).optional(),
  ageConfirmed: z.literal(true),
  termsAccepted: z.literal(true),
  emailTheme: z.enum(["light", "dark"]).optional(),
});

export async function POST(request: Request) {
  const perf = createRequestPerf("api.checkout.POST");
  try {
    const checkoutLimiter = rateLimit({
      key: `checkout:${clientIpFromHeaders(request.headers)}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!checkoutLimiter.ok) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait and try again." },
        {
          status: 429,
          headers: { "Retry-After": String(checkoutLimiter.retryAfterSec) },
        },
      );
    }

    const body = await perf.time("parse_body", async () => checkoutSchema.parse(await request.json()));
    const country = body.country.toUpperCase();
    const settings = await perf.time("get_store_settings", getStoreSettings);
    perf.setFields({
      paymentMethod: body.paymentMethod,
      country,
      hasCoupon: Boolean(body.couponCode?.trim()),
      hasCryptoCurrency: Boolean(body.cryptoCurrency),
    });

    if (await perf.time("country_block_check", async () => isCountryBlockedInSettings(country, settings))) {
      perf.flush({ blocked: true, statusCode: 400 });
      return NextResponse.json(
        { error: "We cannot ship to your selected country." },
        { status: 400 },
      );
    }

    if (body.paymentMethod === "PAYPAL" && !isPayPalConfigured(settings)) {
      perf.flush({ blocked: true, statusCode: 400, reason: "paypal_disabled" });
      return NextResponse.json(
        { error: "PayPal checkout is not enabled." },
        { status: 400 },
      );
    }

    if (body.paymentMethod === "CRYPTO" && !isNowPaymentsConfigured(settings)) {
      perf.flush({ blocked: true, statusCode: 400, reason: "crypto_disabled" });
      return NextResponse.json(
        { error: "Cryptocurrency checkout is not enabled." },
        { status: 400 },
      );
    }

    if (body.paymentMethod === "CRYPTO" && !body.cryptoCurrency) {
      perf.flush({ blocked: true, statusCode: 400, reason: "crypto_missing_currency" });
      return NextResponse.json(
        { error: "Select a cryptocurrency." },
        { status: 400 },
      );
    }

    if (body.paymentMethod === "MANUAL" && !settings.manualPaymentEnabled) {
      perf.flush({ blocked: true, statusCode: 400, reason: "manual_disabled" });
      return NextResponse.json(
        { error: "Manual payment is not enabled." },
        { status: 400 },
      );
    }

    const cartItems = await perf.time("get_cart", getCart);
    const { lines, totalCents: subtotalCents, errors } = await perf.time("resolve_cart", async () =>
      resolveCart(cartItems),
    );
    perf.setFields({
      cartItems: cartItems.length,
      resolvedLines: lines.length,
      subtotalCents,
      resolveErrors: errors.length,
    });
    if (errors.length > 0 || lines.length === 0) {
      perf.flush({ blocked: true, statusCode: 400, reason: "invalid_or_empty_cart" });
      return NextResponse.json({ error: errors.join(" ") || "Cart is empty" }, { status: 400 });
    }

    let couponFreeShipping = false;
    let couponLabel: string | undefined;
    let storedCouponCode: string | undefined;
    let discountCents = 0;

    if (body.couponCode?.trim()) {
      const couponResult = await perf.time("coupon_validate", () =>
        validateCouponCode(body.couponCode!, subtotalCents),
      );
      if (!couponResult.ok) {
        perf.flush({ blocked: true, statusCode: 400, reason: "invalid_coupon" });
        return NextResponse.json({ error: couponResult.error }, { status: 400 });
      }
      storedCouponCode = couponResult.coupon.code;
      couponLabel = couponResult.coupon.label;
      if (couponResult.coupon.freeShipping) {
        couponFreeShipping = true;
      }
    }

    const baseQuote = perf.time("quote_base", async () => quoteOrder(subtotalCents));
    const orderQuote = perf.time("quote_order", async () =>
      quoteOrder(subtotalCents, {
        freeShipping: couponFreeShipping,
        couponLabel,
      }),
    );
    const [baseQuoteResolved, orderQuoteResolved] = await Promise.all([baseQuote, orderQuote]);
    const { shippingCents, totalCents, label: shippingLabel } = orderQuoteResolved;
    if (couponFreeShipping) {
      discountCents = baseQuoteResolved.shippingCents;
    }

    const shippingAddress = {
      name: body.name,
      line1: body.line1,
      line2: body.line2 ?? "",
      city: body.city,
      state: body.state ?? "",
      postalCode: body.postalCode,
      country,
    };

    const order = await perf.time("db_order_create", () =>
      db.order.create({
      data: {
        email: body.email,
        shippingAddress: { ...shippingAddress, shippingLabel },
        paymentMethod: body.paymentMethod,
        subtotalCents,
        shippingCents,
        discountCents,
        couponCode: storedCouponCode,
        totalCents,
        status: "AWAITING_PAYMENT",
        emailTheme: body.emailTheme ?? "light",
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            qty: l.qty,
            unitPriceCents: unitPricePerVialCents(l.priceCents),
          })),
        },
      },
      }),
    );
    perf.setFields({ orderId: order.id, totalCents });

    const baseUrl = settings.siteUrl.replace(/\/$/, "");
    const orderUrl = await perf.time("order_public_url", () =>
      orderPublicUrl(order.id, order.accessToken, settings.siteUrl),
    );

    let redirectUrl = orderUrl;

    if (body.paymentMethod === "MANUAL") {
      await perf.time("notify_manual", () =>
        notifyOrderPlaced({
        orderId: order.id,
        email: body.email,
        accessToken: order.accessToken,
        paymentUrl: orderUrl,
        paymentMethod: "Bank transfer / wire",
        }),
      );
    } else if (body.paymentMethod === "PAYPAL") {
      const paypal = await perf.time("paypal_create_order", () =>
        createPayPalOrder({
        orderId: order.id,
        totalCents,
        returnUrl: `${baseUrl}/api/paypal/capture?orderId=${order.id}&accessToken=${order.accessToken}`,
        cancelUrl: `${orderUrl}&cancelled=1`,
        }),
      );
      await perf.time("db_order_update_paypal", () =>
        db.order.update({
        where: { id: order.id },
        data: { paypalOrderId: paypal.paypalOrderId },
        }),
      );
      redirectUrl = paypal.approvalUrl;
      await perf.time("notify_paypal", () =>
        notifyOrderPlaced({
        orderId: order.id,
        email: body.email,
        accessToken: order.accessToken,
        paymentUrl: paypal.approvalUrl,
        paymentMethod: "PayPal",
        }),
      );
    } else {
      const payCurrency = await perf.time("crypto_assert_currency", () =>
        assertPayCurrencyAllowed(body.cryptoCurrency!),
      );
      const invoice = await perf.time("crypto_create_invoice", () =>
        createNowPaymentsInvoice({
        orderId: order.id,
        totalCents,
        buyerEmail: body.email,
        successUrl: orderUrl,
        cancelUrl: `${orderUrl}&cancelled=1`,
        ipnUrl: `${baseUrl}/api/webhooks/nowpayments`,
        payCurrency,
        }),
      );
      await perf.time("db_order_update_crypto", () =>
        db.order.update({
        where: { id: order.id },
        data: {
          cryptoInvoiceId: invoice.id,
          cryptoPaymentUrl: invoice.invoiceUrl,
          cryptoCurrency: payCurrency,
        },
        }),
      );
      redirectUrl = invoice.invoiceUrl;
      const coinLabel = payCurrency.toUpperCase();
      await perf.time("notify_crypto", () =>
        notifyOrderPlaced({
        orderId: order.id,
        email: body.email,
        accessToken: order.accessToken,
        paymentUrl: invoice.invoiceUrl,
        paymentMethod: `${coinLabel} (NOWPayments)`,
        }),
      );
    }

    if (storedCouponCode) {
      await perf.time("coupon_redeem", () => redeemCoupon(storedCouponCode!));
    }

    await perf.time("clear_cart", clearCart);
    perf.flush({ ok: true, statusCode: 200 });

    return NextResponse.json({ redirectUrl, orderId: order.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      perf.flush({ ok: false, statusCode: 400, reason: "invalid_checkout_data" });
      return NextResponse.json({ error: "Invalid checkout data" }, { status: 400 });
    }
    perf.fail(err, { statusCode: 500 });
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 },
    );
  }
}
