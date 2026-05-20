"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { CouponField } from "@/components/shop/coupon-field";
import { OrderTotalsBreakdown } from "@/components/shop/order-totals-breakdown";
import type { AppliedCoupon } from "@/lib/coupons";
import { formatOrderQty } from "@/lib/order-qty";
import { quoteOrder } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";

type Line = {
  productId: string;
  name: string;
  qty: number;
  lineTotalCents: number;
};

type Props = {
  subtotalCents: number;
  cryptoEnabled: boolean;
  directContactEmails: [string, string];
  lines: Line[];
  initialCouponCode?: string | null;
  initialAppliedCoupon?: AppliedCoupon | null;
};

export function CheckoutExperience({
  subtotalCents,
  cryptoEnabled,
  directContactEmails,
  lines,
  initialCouponCode,
  initialAppliedCoupon,
}: Props) {
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    initialAppliedCoupon ?? null,
  );

  const quote = useMemo(
    () =>
      quoteOrder(subtotalCents, {
        freeShipping: appliedCoupon?.freeShipping,
        couponLabel: appliedCoupon?.label,
      }),
    [subtotalCents, appliedCoupon],
  );

  async function handleCouponChange(
    coupon: AppliedCoupon | null,
    _code: string | null,
  ) {
    setAppliedCoupon(coupon);
    if (!coupon) {
      await fetch("/api/coupons/clear", { method: "POST" });
    }
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:py-12 lg:grid-cols-[1fr_360px]">
      <article className="glass-strong rounded-2xl p-6 md:p-8">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Checkout</h1>
          <Link href="/cart" className="text-sm text-accent hover:underline">
            ← Edit cart
          </Link>
        </header>
        <p className="mt-1 text-sm text-muted-foreground">
          Guest checkout — no account needed.
        </p>
        <div className="mt-6">
          <CheckoutForm
            cryptoEnabled={cryptoEnabled}
            directContactEmails={directContactEmails}
            couponCode={appliedCoupon?.code}
            orderTotalCents={quote.totalCents}
          />
        </div>
      </article>

      <aside className="glass-strong h-fit rounded-2xl p-6 lg:sticky lg:top-24">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Order summary
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{l.name}</p>
                <p className="text-xs text-muted-foreground">{formatOrderQty(l.qty)}</p>
              </div>
              <span className="shrink-0 font-medium tabular-nums text-foreground">
                {formatPrice(l.lineTotalCents)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <CouponField
            subtotalCents={subtotalCents}
            initialCode={initialCouponCode}
            applied={appliedCoupon}
            onApplied={handleCouponChange}
          />
        </div>
        <OrderTotalsBreakdown
          subtotalCents={subtotalCents}
          freeShipping={appliedCoupon?.freeShipping}
          couponLabel={appliedCoupon?.label}
          className="mt-4"
        />
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
          <span>Payment:</span>
          {cryptoEnabled && (
            <>
              <span className="checkout-pay-chip">BTC</span>
              <span className="checkout-pay-chip">LTC</span>
              <span className="checkout-pay-chip">XMR</span>
              <span className="checkout-pay-chip">SOL</span>
              <span className="checkout-pay-chip">XRP</span>
              <span className="checkout-pay-chip">USDT</span>
            </>
          )}
          <span className="checkout-pay-chip">Direct</span>
        </div>
      </aside>
    </section>
  );
}
