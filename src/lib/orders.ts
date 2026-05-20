import { db } from "./db";
import { getStoreSettings } from "./settings";
import { formatPrice } from "./utils";
import {
  sendOrderAwaitingPaymentEmail,
  sendPaymentConfirmedEmail,
} from "./email";

export async function orderPublicUrl(
  orderId: string,
  accessToken: string,
  siteUrl?: string,
): Promise<string> {
  const base = (siteUrl ?? (await getStoreSettings()).siteUrl).replace(/\/$/, "");
  return `${base}/order/${orderId}?token=${accessToken}`;
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

  await sendPaymentConfirmedEmail({
    to: order.email,
    orderId: order.id,
    totalFormatted: formatPrice(order.totalCents),
    orderUrl: await orderPublicUrl(order.id, order.accessToken),
  });
}

export async function notifyAwaitingPayment(params: {
  orderId: string;
  email: string;
  totalCents: number;
  accessToken: string;
  paymentUrl: string;
  paymentMethod: string;
}): Promise<void> {
  await sendOrderAwaitingPaymentEmail({
    to: params.email,
    orderId: params.orderId,
    totalFormatted: formatPrice(params.totalCents),
    paymentUrl: params.paymentUrl,
    paymentMethod: params.paymentMethod,
  });
}
