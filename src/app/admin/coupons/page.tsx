import { CouponForm } from "@/components/admin/coupon-form";
import { Button } from "@/components/ui/button";
import { deleteCouponAction, toggleCouponAction } from "@/lib/admin-actions";
import { db } from "@/lib/db";

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Coupons</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage checkout discount codes. Supports free shipping and percent-off coupons.
        </p>
      </header>

      {params.saved && (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          Coupon saved.
        </p>
      )}
      {params.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          Could not save coupon. Check the fields and try again.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="glass-strong overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--outline)] text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Uses</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No coupons yet.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--outline)] last:border-0">
                    <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                    <td className="px-4 py-3">
                      {c.type === "FREE_SHIPPING"
                        ? "Free shipping"
                        : c.type === "PERCENT_OFF"
                          ? `${((c.percentBps ?? 0) / 100).toFixed(
                              (c.percentBps ?? 0) % 100 === 0 ? 0 : 2,
                            )}% off`
                          : c.type}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {c.usedCount}
                      {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {c.isActive ? (
                        <span className="text-accent">Active</span>
                      ) : (
                        <span className="text-muted-foreground">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <form action={toggleCouponAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            {c.isActive ? "Disable" : "Enable"}
                          </Button>
                        </form>
                        <form action={deleteCouponAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <CouponForm />
      </div>
    </div>
  );
}
