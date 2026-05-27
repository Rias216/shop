import { quoteOrder, shippingHint } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";

type Props = {
  subtotalCents: number;
  freeShipping?: boolean;
  couponLabel?: string;
  percentBps?: number;
  discountLabel?: string;
  className?: string;
};

/** Subtotal, shipping, total — shared by cart and checkout. */
export function OrderTotalsBreakdown({
  subtotalCents,
  freeShipping,
  couponLabel,
  percentBps,
  discountLabel,
  className,
}: Props) {
  const quote = quoteOrder(subtotalCents, {
    freeShipping,
    couponLabel,
    percentBps,
    discountLabel,
  });
  const hint = shippingHint(subtotalCents);

  return (
    <dl className={className}>
      <div className="flex justify-between gap-3 text-sm">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="tabular-nums font-medium text-price">{formatPrice(quote.subtotalCents)}</dd>
      </div>
      {quote.discountCents > 0 && (
        <div className="mt-2 flex justify-between gap-3 text-sm">
          <dt className="text-muted-foreground">
            Discount
            {quote.discountLabel && (
              <span className="ml-1 text-xs text-accent">({quote.discountLabel})</span>
            )}
          </dt>
          <dd className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
            −{formatPrice(quote.discountCents)}
          </dd>
        </div>
      )}
      <div className="mt-2 flex justify-between gap-3 text-sm">
        <dt className="text-muted-foreground">
          Shipping
          {quote.label !== "Standard shipping" && (
            <span className="ml-1 text-xs text-accent">({quote.label})</span>
          )}
        </dt>
        <dd className="tabular-nums font-medium text-price">
          {quote.shippingCents === 0 ? (
            <span>Free</span>
          ) : (
            formatPrice(quote.shippingCents)
          )}
        </dd>
      </div>
      {hint && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      )}
      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-[var(--outline)] pt-3">
        <dt className="text-sm font-semibold text-foreground">Total</dt>
        <dd className="text-xl font-semibold tabular-nums text-price">
          {formatPrice(quote.totalCents)}
        </dd>
      </div>
    </dl>
  );
}
