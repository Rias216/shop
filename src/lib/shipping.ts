/** Flat shipping before discounts (USD $50). */
export const SHIPPING_FLAT_CENTS = 5_000;

/** Subtotal at or above this → free shipping ($300). */
export const SHIPPING_FREE_MIN_CENTS = 30_000;

export type ShippingQuote = {
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  /** Short label for UI, e.g. "Free shipping" */
  label: string;
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
};

export function quoteOrder(
  subtotalCents: number,
  options?: QuoteOrderOptions,
): ShippingQuote {
  const base = calculateShipping(subtotalCents);
  const shippingCents = options?.freeShipping ? 0 : base.shippingCents;
  const label = options?.freeShipping
    ? (options.couponLabel ?? "Free shipping (coupon)")
    : base.label;
  return {
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    label,
  };
}

export function shippingHint(subtotalCents: number): string | null {
  if (subtotalCents <= 0) return null;
  if (subtotalCents >= SHIPPING_FREE_MIN_CENTS) return null;
  const toFree = SHIPPING_FREE_MIN_CENTS - subtotalCents;
  return `Add $${(toFree / 100).toFixed(2)} more for free shipping`;
}
