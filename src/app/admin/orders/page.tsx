import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <article>
      <h1 className="text-2xl font-bold">Orders</h1>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="py-2">ID</th>
            <th>Email</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Date</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-3 font-mono text-xs">{o.id.slice(-8)}</td>
              <td>{o.email}</td>
              <td>{o.status}</td>
              <td>
                {o.paymentMethod} / {o.paymentStatus}
              </td>
              <td className="text-price tabular-nums">{formatPrice(o.totalCents)}</td>
              <td>{o.createdAt.toLocaleDateString()}</td>
              <td>
                <Link href={`/admin/orders/${o.id}`} className="underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
