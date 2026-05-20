import { db } from "@/lib/db";
import { getCouponCodeFromCookie } from "@/lib/coupon-cookie";
import type { Coupon, CouponType } from "@/generated/prisma/client";

export type AppliedCoupon = {
  code: string;
  type: CouponType;
  freeShipping: boolean;
  label: string;
};

export type CouponValidation =
  | { ok: true; coupon: AppliedCoupon }
  | { ok: false; error: string };

export async function validateCouponCode(
  rawCode: string,
  subtotalCents: number,
): Promise<CouponValidation> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { ok: false, error: "Enter a coupon code." };
  }
  if (subtotalCents <= 0) {
    return { ok: false, error: "Cart is empty." };
  }

  const row = await db.coupon.findUnique({ where: { code } });

  if (!row) {
    return { ok: false, error: "Invalid coupon code." };
  }

  const err = couponInactiveReason(row);
  if (err) {
    return { ok: false, error: err };
  }

  return { ok: true, coupon: toAppliedCoupon(row) };
}

function couponInactiveReason(coupon: Coupon): string | null {
  if (!coupon.isActive) return "This coupon is no longer active.";
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return "This coupon has expired.";
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return "This coupon has reached its usage limit.";
  }
  return null;
}

function toAppliedCoupon(coupon: Coupon): AppliedCoupon {
  if (coupon.type === "FREE_SHIPPING") {
    return {
      code: coupon.code.toUpperCase(),
      type: coupon.type,
      freeShipping: true,
      label: "Free shipping",
    };
  }
  return {
    code: coupon.code.toUpperCase(),
    type: coupon.type,
    freeShipping: false,
    label: "Discount applied",
  };
}

export async function getAppliedCouponFromCookie(
  subtotalCents: number,
): Promise<AppliedCoupon | null> {
  const code = await getCouponCodeFromCookie();
  if (!code) return null;
  const result = await validateCouponCode(code, subtotalCents);
  return result.ok ? result.coupon : null;
}

export async function redeemCoupon(code: string): Promise<void> {
  const normalized = code.trim().toUpperCase();
  await db.coupon.update({
    where: { code: normalized },
    data: { usedCount: { increment: 1 } },
  });
}
