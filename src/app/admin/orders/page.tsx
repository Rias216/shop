import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deleteAllOrdersAction, deleteOrderAction } from "@/lib/admin-actions";
import { db } from "@/lib/db";
import { sweepStaleCryptoOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ wiped?: string; wipeError?: string }>;
}) {
  const { wiped, wipeError } = await searchParams;
  await sweepStaleCryptoOrders();
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <article>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Orders</h1>
        {orders.length > 0 && (
          <form action={deleteAllOrdersAction} className="flex items-center gap-2">
            <input
              type="text"
              name="confirm"
              placeholder='Type DELETE to wipe all'
              required
              className="h-9 rounded-md border border-zinc-300 px-3 text-xs dark:border-zinc-700"
            />
            <Button type="submit" variant="destructive" size="sm">
              Delete all orders
            </Button>
          </form>
        )}
      </div>
      {wiped && (
        <p className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
          All orders deleted.
        </p>
      )}
      {wipeError && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Type <code>DELETE</code> exactly to confirm wiping all orders.
        </p>
      )}
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
              <td className="space-x-3">
                <Link href={`/admin/orders/${o.id}`} className="underline">
                  View
                </Link>
                <form action={deleteOrderAction} className="inline">
                  <input type="hidden" name="orderId" value={o.id} />
                  <button
                    type="submit"
                    className="text-red-600 underline hover:text-red-700"
                    title="Delete this order"
                  >
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
