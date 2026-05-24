import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CartQtyStepper } from "@/components/shop/cart-qty-stepper";
import { PaperCupIcon } from "@/components/shop/paper-cup-icon";
import { ProductGraphic } from "@/components/shop/product-graphic";
import { getCouponCodeFromCookie } from "@/lib/coupon-cookie";
import { getAppliedCouponFromCookie } from "@/lib/coupons";
import { resolveCartFromCookie } from "@/lib/resolve-cart";
import { OrderSummaryPanel } from "@/components/shop/order-summary-panel";
import { formatBlockPrice, formatPerVialPrice } from "@/lib/pricing";
import { quoteOrder } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";

export default async function CartPage() {
  const { lines, totalCents: subtotalCents, errors } = await resolveCartFromCookie();
  const [initialCouponCode, initialAppliedCoupon] = await Promise.all([
    getCouponCodeFromCookie(),
    getAppliedCouponFromCookie(subtotalCents),
  ]);
  const orderQuote = quoteOrder(subtotalCents, {
    freeShipping: initialAppliedCoupon?.freeShipping,
  });
  const totalQty = lines.reduce((sum, line) => sum + line.qty, 0);

  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <PaperCupIcon className="mx-auto h-20 w-16" />
        <h1 className="mt-6 text-2xl font-semibold text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse the shop and add a few kits to get started.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/catalog">Browse shop</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Your cart
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lines.length} item{lines.length === 1 ? "" : "s"} · adjust quantities below
        </p>
      </header>

      {errors.length > 0 && (
        <ul className="mb-6 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4 text-sm text-[var(--warning-text)]">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
        <ul
          className="cart-list glass-strong h-fit w-full self-start divide-y divide-[var(--outline)] overflow-hidden rounded-xl"
          style={
            {
              "--cart-items": lines.length,
              "--cart-qty": totalQty,
            } as React.CSSProperties
          }
        >
          {lines.map((line) => (
            <li key={line.productId} className="cart-row">
              <div className="cart-row-thumb">
                <ProductGraphic
                  slug={line.slug}
                  name={line.name}
                  sku={line.sku}
                  category={line.category}
                  size="sm"
                  className="cart-row-graphic h-full w-full min-h-0"
                />
              </div>
              <div className="cart-row-main">
                <div className="cart-row-header">
                  <Link
                    href={`/products/${line.slug}`}
                    className="cart-row-title font-medium text-foreground hover:text-accent"
                  >
                    {line.name}
                  </Link>
                  <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                    {formatPerVialPrice(line.priceCents)} · {formatBlockPrice(line.priceCents)}
                  </p>
                </div>
                <CartQtyStepper
                  productId={line.productId}
                  initialQty={line.qty}
                  stock={line.stock}
                />
              </div>
              <div className="cart-row-side">
                <p className="cart-row-total tabular-nums">
                  {formatPrice(line.lineTotalCents)}
                </p>
                <Link
                  href={`/products/${line.slug}`}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  View product
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <aside className="cart-summary glass-strong h-fit rounded-xl p-4 lg:sticky lg:top-24">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Summary
          </h2>
          <OrderSummaryPanel
            subtotalCents={subtotalCents}
            initialCouponCode={initialCouponCode}
            initialAppliedCoupon={initialAppliedCoupon}
            checkoutHref="/checkout"
            checkoutLabel={`Checkout — ${formatPrice(orderQuote.totalCents)}`}
            className="mt-3"
          />
          <Link
            href="/catalog"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-accent"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}
