import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatOrderQty } from "@/lib/order-qty";
import { formatPrice } from "@/lib/utils";
import { getStoreSettings } from "@/lib/settings";
import { fetchNowPaymentsInvoiceState } from "@/lib/payments/nowpayments";
import { markOrderPaid } from "@/lib/orders";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; cancelled?: string }>;
}) {
  const { id } = await params;
  const { token, cancelled } = await searchParams;

  if (!token) notFound();

  const [order, settings] = await Promise.all([
    db.order.findFirst({
      where: { id, accessToken: token },
      include: {
        items: { include: { product: { select: { name: true, slug: true } } } },
      },
    }),
    getStoreSettings(),
  ]);

  if (!order) notFound();

  let effectiveOrder = order;

  if (
    order.paymentMethod === "CRYPTO" &&
    order.cryptoInvoiceId &&
    order.paymentStatus === "PENDING"
  ) {
    const remoteStatus = await fetchNowPaymentsInvoiceState(order.cryptoInvoiceId);
    if (remoteStatus === "COMPLETED") {
      await markOrderPaid(order.id);
      const refreshed = await db.order.findUnique({
        where: { id: order.id },
        include: {
          items: { include: { product: { select: { name: true, slug: true } } } },
        },
      });
      if (refreshed) effectiveOrder = refreshed;
    } else if (remoteStatus === "FAILED") {
      const refreshed = await db.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", paymentStatus: "FAILED" },
        include: {
          items: { include: { product: { select: { name: true, slug: true } } } },
        },
      });
      effectiveOrder = refreshed;
    } else if (remoteStatus === "REFUNDED") {
      const refreshed = await db.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
        include: {
          items: { include: { product: { select: { name: true, slug: true } } } },
        },
      });
      effectiveOrder = refreshed;
    }
  }

  let paymentLink: string | null = null;
  const showAwaitingPayment =
    effectiveOrder.status === "AWAITING_PAYMENT" && effectiveOrder.paymentStatus === "PENDING";
  const showPaymentExpired =
    effectiveOrder.paymentMethod === "CRYPTO" &&
    effectiveOrder.status === "CANCELLED" &&
    effectiveOrder.paymentStatus === "FAILED";
  const showPaymentRefunded = effectiveOrder.paymentStatus === "REFUNDED";
  const showPaymentPaid =
    effectiveOrder.paymentStatus === "COMPLETED" ||
    effectiveOrder.status === "PAID" ||
    effectiveOrder.status === "SHIPPED";

  if (
    showAwaitingPayment &&
    effectiveOrder.paymentMethod === "CRYPTO" &&
    effectiveOrder.cryptoPaymentUrl
  ) {
    paymentLink = effectiveOrder.cryptoPaymentUrl;
  }

  return (
    <section className="relative z-10 mx-auto max-w-2xl px-4 py-16">
        <article className="glass-strong p-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Order #{effectiveOrder.id.slice(-8).toUpperCase()}
          </h1>
          {showPaymentPaid && (
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              Payment received.
            </p>
          )}
          {showAwaitingPayment && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              Awaiting payment.
            </p>
          )}
          {showPaymentExpired && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Payment expired or failed.
            </p>
          )}
          {showPaymentRefunded && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Payment was refunded.
            </p>
          )}
          {cancelled && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              Payment was cancelled.
            </p>
          )}
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium text-foreground">{effectiveOrder.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="text-foreground">
                {effectiveOrder.paymentMethod} — {effectiveOrder.paymentStatus}
              </dd>
            </div>
            {effectiveOrder.subtotalCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="text-price">{formatPrice(effectiveOrder.subtotalCents)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="text-price">
                {effectiveOrder.shippingCents === 0 ? "Free" : formatPrice(effectiveOrder.shippingCents)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-semibold text-price">{formatPrice(effectiveOrder.totalCents)}</dd>
            </div>
            {effectiveOrder.paymentMethod === "MANUAL" && settings.manualPaymentInstructions && (
              <div className="mt-4 rounded-lg border border-[var(--outline)] bg-[var(--glass-bg-subtle)] p-3 text-xs leading-relaxed text-muted-foreground">
                {settings.manualPaymentInstructions}
              </div>
            )}
            {effectiveOrder.trackingNumber && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tracking</dt>
                <dd className="text-foreground">{effectiveOrder.trackingNumber}</dd>
              </div>
            )}
          </dl>
          <ul className="mt-8 divide-y divide-[var(--divider)]">
            {effectiveOrder.items.map((item) => (
              <li key={item.id} className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">
                  {item.product.name} · {formatOrderQty(item.qty)}
                </span>
                <span className="font-medium text-price">
                  {formatPrice(item.unitPriceCents * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          {paymentLink && (
            <Button asChild className="mt-8 w-full">
              <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                Complete crypto payment
              </a>
            </Button>
          )}
          <p className="mt-8 text-center">
            <Link href="/catalog" className="text-sm text-muted-foreground hover:text-accent">
              ← Back to shop
            </Link>
          </p>
        </article>
    </section>
  );
}
