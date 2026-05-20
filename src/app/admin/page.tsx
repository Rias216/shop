import Link from "next/link";
import { db } from "@/lib/db";
import {
  getStoreSettings,
  isBtcPayConfigured,
  isEmailConfigured,
  isPayPalConfigured,
} from "@/lib/settings";
import { getPendingReviewCount } from "@/lib/reviews";

export default async function AdminDashboardPage() {
  const [productCount, orderCount, pendingOrders, pendingReviews, settings] =
    await Promise.all([
      db.product.count(),
      db.order.count(),
      db.order.count({ where: { status: "AWAITING_PAYMENT" } }),
      getPendingReviewCount(),
      getStoreSettings(),
    ]);

  const paypalReady = isPayPalConfigured(settings);
  const cryptoReady = isBtcPayConfigured(settings);
  const emailReady = isEmailConfigured(settings);

  return (
    <article>
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <Link href="/admin/settings" className="font-medium text-accent hover:underline">
          Store settings
        </Link>{" "}
        — PayPal {paypalReady ? "ready" : "off"}, Crypto {cryptoReady ? "ready" : "off"}, Email{" "}
        {emailReady ? "ready" : "console only"}
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Products", count: productCount, href: "/admin/products", cta: "Manage" },
          { label: "Orders", count: orderCount, href: "/admin/orders", cta: "View all" },
          { label: "Awaiting payment", count: pendingOrders, href: "/admin/orders", cta: null },
          {
            label: "Reviews to moderate",
            count: pendingReviews,
            href: "/admin/reviews?status=PENDING",
            cta: pendingReviews > 0 ? "Moderate" : null,
          },
        ].map((card) => (
          <li key={card.label} className="glass-strong rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-3xl font-semibold text-foreground">{card.count}</p>
            {card.cta && (
              <Link
                href={card.href}
                className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
              >
                {card.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}
