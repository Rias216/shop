/** Flat shipping before discounts (USD $50). */
export const SHIPPING_FLAT_CENTS = 5_000;

/** Subtotal at or above this → free shipping ($300). */
export const SHIPPING_FREE_MIN_CENTS = 30_000;

export type ShippingQuote = {
  subtotalCents: number;
  /** Discount applied to subtotal (e.g. percent-off coupon). */
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  /** Short label for shipping line, e.g. "Free shipping" */
  label: string;
  /** Short label for discount line, e.g. "9.09% off" */
  discountLabel?: string;
};

export function calculateShipping(subtotalCents: number): Pick<
  ShippingQuote,
  "shippingCents" | "label"
> {
  if (subtotalCents <= 0) {
    return { shippingCents: 0, label: "—" };
  }
  if (subtotalCents >= SHIPPING_FREE_MIN_CENTS) {
    return { shippingCents: 0, label: "Free shipping" };
  }
  return { shippingCents: SHIPPING_FLAT_CENTS, label: "Standard shipping" };
}

export type QuoteOrderOptions = {
  /** Coupon forces $0 shipping regardless of subtotal tiers. */
  freeShipping?: boolean;
  couponLabel?: string;
  /** Percent-off discount in basis points (1/10000). E.g. 909 = 9.09%. */
  percentBps?: number;
  discountLabel?: string;
};

export function quoteOrder(
  subtotalCents: number,
  options?: QuoteOrderOptions,
): ShippingQuote {
  const percentBps = Math.max(0, options?.percentBps ?? 0);
  const discountCents = percentBps > 0
    ? Math.round((subtotalCents * percentBps) / 10_000)
    : 0;
  const discountedSubtotal = Math.max(0, subtotalCents - discountCents);

  const base = calculateShipping(discountedSubtotal);
  const shippingCents = options?.freeShipping ? 0 : base.shippingCents;
  const label = options?.freeShipping
    ? (options.couponLabel ?? "Free shipping (coupon)")
    : base.label;

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: discountedSubtotal + shippingCents,
    label,
    discountLabel: discountCents > 0 ? options?.discountLabel : undefined,
  };
}

export function shippingHint(subtotalCents: number): string | null {
  if (subtotalCents <= 0) return null;
  if (subtotalCents >= SHIPPING_FREE_MIN_CENTS) return null;
  const toFree = SHIPPING_FREE_MIN_CENTS - subtotalCents;
  return `Add $${(toFree / 100).toFixed(2)} more for free shipping`;
}
