import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { capturePayPalOrder } from "@/lib/payments/paypal";
import { markOrderPaid, orderPublicUrl } from "@/lib/orders";
import { createRequestPerf } from "@/lib/perf";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

function parseUsdToCents(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export async function GET(request: Request) {
  const perf = createRequestPerf("api.paypal.capture.GET");
  const captureLimiter = rateLimit({
    key: `paypal-capture:${clientIpFromHeaders(request.headers)}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!captureLimiter.ok) {
    return NextResponse.json(
      { error: "Too many capture attempts. Please wait and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(captureLimiter.retryAfterSec) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const accessToken = searchParams.get("accessToken");
  perf.setFields({ hasOrderId: Boolean(orderId), hasAccessToken: Boolean(accessToken) });

  if (!orderId || !accessToken) {
    perf.flush({ ok: false, statusCode: 302, reason: "missing_query" });
    return NextResponse.redirect(new URL("/", request.url));
  }

  const order = await perf.time("db_order_lookup", () =>
    db.order.findFirst({
      where: { id: orderId, accessToken },
    }),
  );
  perf.setFields({ foundOrder: Boolean(order), hasPayPalOrderId: Boolean(order?.paypalOrderId) });

  if (!order || !order.paypalOrderId) {
    perf.flush({ ok: false, statusCode: 302, reason: "order_not_found_or_missing_paypal" });
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    if (order.paypalCaptureId) {
      const redirectUrl = await perf.time("order_public_url_existing_capture", () =>
        orderPublicUrl(order.id, order.accessToken),
      );
      perf.flush({ ok: true, statusCode: 302, skipped: true, reason: "already_captured" });
      return NextResponse.redirect(redirectUrl);
    }

    const result = await perf.time("paypal_capture", () => capturePayPalOrder(order.paypalOrderId!));
    const capturedCents = parseUsdToCents(result.amountValue);
    const amountMatches = capturedCents != null && capturedCents === order.totalCents;
    const currencyMatches = (result.amountCurrency ?? "").toUpperCase() === "USD";
    perf.setFields({
      paypalCaptureSuccess: result.success,
      amountMatches,
      currencyMatches,
      hasCaptureId: Boolean(result.captureId),
    });

    if (result.success) {
      if (!amountMatches || !currencyMatches || !result.captureId) {
        perf.flush({ ok: false, statusCode: 302, reason: "paypal_amount_or_currency_mismatch" });
        return NextResponse.redirect(new URL("/", request.url));
      }
      await perf.time("persist_capture_id", () =>
        db.order.update({
          where: { id: order.id },
          data: {
            paypalCaptureId: result.captureId,
            paypalCapturedAt: new Date(),
          },
        }),
      );
      await perf.time("mark_order_paid", () => markOrderPaid(order.id));
    }
  } catch (e) {
    perf.fail(e, { statusCode: 302, reason: "paypal_capture_exception" });
    console.error("PayPal capture error:", e);
  }

  const redirectUrl = await perf.time("order_public_url", () =>
    orderPublicUrl(order.id, order.accessToken),
  );
  perf.flush({ ok: true, statusCode: 302 });
  return NextResponse.redirect(redirectUrl);
}
