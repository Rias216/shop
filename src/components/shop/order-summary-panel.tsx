"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CouponField } from "@/components/shop/coupon-field";
import { OrderTotalsBreakdown } from "@/components/shop/order-totals-breakdown";
import type { AppliedCoupon } from "@/lib/coupons";
import { quoteOrder } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";

type Props = {
  subtotalCents: number;
  initialCouponCode?: string | null;
  initialAppliedCoupon?: AppliedCoupon | null;
  checkoutHref?: string;
  checkoutLabel?: string;
  className?: string;
};

export function OrderSummaryPanel({
  subtotalCents,
  initialCouponCode,
  initialAppliedCoupon,
  checkoutHref,
  checkoutLabel,
  className,
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
    <div className={className}>
      <CouponField
        subtotalCents={subtotalCents}
        initialCode={initialCouponCode}
        applied={appliedCoupon}
        onApplied={handleCouponChange}
      />
      <OrderTotalsBreakdown
        subtotalCents={subtotalCents}
        freeShipping={appliedCoupon?.freeShipping}
        couponLabel={appliedCoupon?.label}
        className="mt-3"
      />
      {checkoutHref && (
        <Button asChild className="mt-4 w-full">
          <Link href={checkoutHref}>
            {checkoutLabel ?? `Checkout — ${formatPrice(quote.totalCents)}`}
          </Link>
        </Button>
      )}
    </div>
  );
}
