import { db } from "./db";
import { fetchNowPaymentsInvoiceState } from "./payments/nowpayments";
import { getStoreSettings } from "./settings";
import { formatPrice } from "./utils";
import {
  resolveEmailTheme,
  sendOrderConfirmationEmail,
  sendPaymentConfirmedEmail,
  type OrderEmailSummary,
} from "./email";

export async function orderPublicUrl(
  orderId: string,
  accessToken: string,
  siteUrl?: string,
): Promise<string> {
  const base = (siteUrl ?? (await getStoreSettings()).siteUrl).replace(/\/$/, "");
  return `${base}/order/${orderId}?token=${accessToken}`;
}

function shippingLabelFromAddress(shippingAddress: unknown): string | undefined {
  if (!shippingAddress || typeof shippingAddress !== "object") return undefined;
  const label = (shippingAddress as { shippingLabel?: unknown }).shippingLabel;
  return typeof label === "string" ? label : undefined;
}

async function orderEmailSummary(orderId: string): Promise<OrderEmailSummary | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) return null;

  return {
    orderId: order.id,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    discountCents: order.discountCents,
    totalCents: order.totalCents,
    shippingLabel: shippingLabelFromAddress(order.shippingAddress),
    lines: order.items.map((item) => ({
      name: item.product.name,
      qty: item.qty,
      unitPriceCents: item.unitPriceCents,
    })),
  };
}

export async function markOrderPaid(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.paymentStatus === "COMPLETED") return;

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", paymentStatus: "COMPLETED" },
    });
    await Promise.all(
      order.items.map((item) =>
        tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } },
        }),
      ),
    );
  });

  try {
    await sendPaymentConfirmedEmail({
      to: order.email,
      orderId: order.id,
      totalFormatted: formatPrice(order.totalCents),
      orderUrl: await orderPublicUrl(order.id, order.accessToken),
      theme: resolveEmailTheme(order.emailTheme),
    });
  } catch (error) {
    console.error("[email] payment confirmed failed:", error);
  }
}

export async function notifyOrderPlaced(params: {
  orderId: string;
  email: string;
  accessToken: string;
  paymentUrl: string;
  paymentMethod: string;
}): Promise<void> {
  const summary = await orderEmailSummary(params.orderId);
  if (!summary) return;

  const order = await db.order.findUnique({
    where: { id: params.orderId },
    select: { emailTheme: true },
  });

  try {
    await sendOrderConfirmationEmail({
      to: params.email,
      orderId: params.orderId,
      paymentUrl: params.paymentUrl,
      paymentMethod: params.paymentMethod,
      orderUrl: await orderPublicUrl(params.orderId, params.accessToken),
      summary,
      theme: resolveEmailTheme(order?.emailTheme),
    });
  } catch (error) {
    console.error("[email] order confirmation failed:", error);
  }
}

const STALE_PENDING_MIN_AGE_MS = 30 * 60 * 1000;
const SWEEP_BATCH_SIZE = 25;

/**
 * Poll NOWPayments for any pending CRYPTO orders that are old enough to be
 * terminal (paid, failed, refunded, or expired) and update them. Safe to call
 * from server components — bounded and best-effort.
 */
export async function sweepStaleCryptoOrders(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_PENDING_MIN_AGE_MS);
  const stale = await db.order.findMany({
    where: {
      paymentMethod: "CRYPTO",
      paymentStatus: "PENDING",
      cryptoInvoiceId: { not: null },
      createdAt: { lt: cutoff },
    },
    select: { id: true, cryptoInvoiceId: true, paymentStatus: true },
    orderBy: { createdAt: "asc" },
    take: SWEEP_BATCH_SIZE,
  });

  if (stale.length === 0) return;

  await Promise.all(
    stale.map(async (order) => {
      if (!order.cryptoInvoiceId) return;
      try {
        const state = await fetchNowPaymentsInvoiceState(order.cryptoInvoiceId);
        if (state === "COMPLETED") {
          await markOrderPaid(order.id);
        } else if (state === "FAILED") {
          await db.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED", paymentStatus: "FAILED" },
          });
        } else if (state === "REFUNDED") {
          await db.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
          });
        }
      } catch (error) {
        console.error("[orders] sweep failed for", order.id, error);
      }
    }),
  );
}

/** @deprecated use notifyOrderPlaced */
export async function notifyAwaitingPayment(params: {
  orderId: string;
  email: string;
  totalCents: number;
  accessToken: string;
  paymentUrl: string;
  paymentMethod: string;
}): Promise<void> {
  await notifyOrderPlaced(params);
}
