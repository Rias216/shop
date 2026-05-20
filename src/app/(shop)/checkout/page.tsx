import Link from "next/link";
import { CheckoutExperience } from "@/components/shop/checkout-experience";
import { getCart, pruneOrphanCartItems } from "@/lib/cart";
import { getCouponCodeFromCookie } from "@/lib/coupon-cookie";
import { getAppliedCouponFromCookie } from "@/lib/coupons";
import { getDirectPaymentEmails } from "@/lib/payments/direct-contact";
import { resolveCart } from "@/lib/resolve-cart";
import { getStoreSettings } from "@/lib/settings";

export default async function CheckoutPage() {
  await pruneOrphanCartItems();
  const [items, settings] = await Promise.all([getCart(), getStoreSettings()]);
  const { lines, totalCents: subtotalCents, errors } = await resolveCart(items);
  const [initialCouponCode, initialAppliedCoupon] = await Promise.all([
    getCouponCodeFromCookie(),
    getAppliedCouponFromCookie(subtotalCents),
  ]);

  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="glass-strong rounded-2xl py-12 text-muted-foreground">
          Your cart is empty.
        </p>
        <Link
          href="/catalog"
          className="mt-4 inline-block font-medium text-accent hover:underline"
        >
          Continue shopping
        </Link>
      </section>
    );
  }

  return (
    <>
      {errors.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <ul className="rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] p-3 text-sm text-[var(--warning-text)]">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <CheckoutExperience
        subtotalCents={subtotalCents}
        cryptoEnabled={settings.cryptoEnabled}
        directContactEmails={getDirectPaymentEmails(settings.emailFrom)}
        initialCouponCode={initialCouponCode}
        initialAppliedCoupon={initialAppliedCoupon}
        lines={lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          qty: l.qty,
          lineTotalCents: l.lineTotalCents,
        }))}
      />
    </>
  );
}
