import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  refreshOrderFromProviderAction,
  updateOrderStatusAction,
} from "@/lib/admin-actions";
import { db } from "@/lib/db";
import { formatOrderQty } from "@/lib/order-qty";
import { formatPrice } from "@/lib/utils";
import { orderPublicUrl } from "@/lib/orders";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true } } } },
    },
  });
  if (!order) notFound();

  const publicUrl = await orderPublicUrl(order.id, order.accessToken);

  const address = order.shippingAddress as {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };

  return (
    <article className="max-w-2xl">
      <h1 className="text-2xl font-bold">Order #{order.id.slice(-8).toUpperCase()}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        <a href={publicUrl} className="underline">
          Customer view link
        </a>
      </p>
      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-zinc-500">Email</dt>
          <dd>{order.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Status</dt>
          <dd>{order.status}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Payment</dt>
          <dd>
            {order.paymentMethod} / {order.paymentStatus}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Total</dt>
          <dd className="font-semibold text-price">{formatPrice(order.totalCents)}</dd>
        </div>
      </dl>
      <section className="mt-6 text-sm">
        <h2 className="font-semibold">Shipping</h2>
        <p className="mt-2">
          {address.name}
          <br />
          {address.line1}
          {address.line2 && (
            <>
              <br />
              {address.line2}
            </>
          )}
          <br />
          {address.city}, {address.state} {address.postalCode}
          <br />
          {address.country}
        </p>
      </section>
      <ul className="mt-6 divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between py-2">
            <span>
              {item.product.name} · {formatOrderQty(item.qty)}
            </span>
            <span className="text-price tabular-nums">{formatPrice(item.unitPriceCents * item.qty)}</span>
          </li>
        ))}
      </ul>
      {order.paymentMethod === "CRYPTO" && order.cryptoInvoiceId && (
        <form
          action={refreshOrderFromProviderAction}
          className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <input type="hidden" name="orderId" value={order.id} />
          <p className="text-sm text-zinc-500">
            Poll NOWPayments for the latest status of invoice{" "}
            <code className="font-mono text-xs">{order.cryptoInvoiceId}</code>.
          </p>
          <Button type="submit" variant="outline" className="mt-3">
            Refresh from NOWPayments
          </Button>
        </form>
      )}
      <form action={updateOrderStatusAction} className="mt-10 space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <input type="hidden" name="orderId" value={order.id} />
        <p>
          <Label htmlFor="status">Update status</Label>
          <select
            id="status"
            name="status"
            defaultValue={order.status}
            className="mt-1 flex h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
          >
            <option value="AWAITING_PAYMENT">AWAITING_PAYMENT</option>
            <option value="PAID">PAID</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </p>
        <p>
          <Label htmlFor="trackingNumber">Tracking number</Label>
          <Input
            id="trackingNumber"
            name="trackingNumber"
            defaultValue={order.trackingNumber ?? ""}
            className="mt-1"
          />
        </p>
        <Button type="submit">Save</Button>
      </form>
    </article>
  );
}
