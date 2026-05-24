import Link from "next/link";
import { AddToCartControls } from "@/components/shop/add-to-cart-controls";
import { CoaPurityButton } from "@/components/shop/coa-purity-button";
import { ProductGraphic } from "@/components/shop/product-graphic";
import { ProductStars } from "@/components/shop/product-stars";
import type { ProductRatingSummary } from "@/lib/reviews";
import { formatPurityLabel } from "@/lib/coa";
import { ORDER_QTY_MIN_NOTE, canOrderProduct } from "@/lib/order-qty";
import { displayNameFromProduct } from "@/lib/product-groups";
import { ProductPrice } from "@/components/shop/product-price";
import type { Product, CoaDocument } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

type ProductWithCoa = Product & {
  coaDocuments: Pick<CoaDocument, "fileUrl" | "batchCode" | "issuedAt">[];
};

export function ProductCard({
  product,
  latestCoaUrl,
  ratingSummary,
  className,
}: {
  product: ProductWithCoa;
  latestCoaUrl?: string;
  ratingSummary?: ProductRatingSummary;
  className?: string;
}) {
  const purityLabel = product.purity ? formatPurityLabel(product.purity) : null;
  const cardTitle = displayNameFromProduct(product);
  const productHref = `/products/${product.slug}`;
  const showCart = canOrderProduct(product.stock);

  return (
    <div className={cn("product-card glass glass-hover group flex flex-col overflow-hidden", className)}>
      <Link
        href={productHref}
        prefetch={false}
        className="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40"
      >
        <ProductGraphic
          slug={product.slug}
          name={cardTitle}
          sku={product.sku}
          category={product.category}
          variantLabel={product.variantLabel}
          preferCategorySubtitle
          size="md"
          className="w-full shrink-0"
        />
      </Link>

      <div className="product-card-body">
        <Link
          href={productHref}
          prefetch={false}
          className="product-card-title outline-none hover:text-accent focus-visible:underline"
        >
          <h3>{cardTitle}</h3>
        </Link>

        <div className="product-card-stars">
          <ProductStars
            summary={ratingSummary ?? { average: 0, count: 0 }}
            size="sm"
            showCount={Boolean(ratingSummary?.count)}
          />
        </div>

        {purityLabel && (
          <div className="product-card-row">
            <div className="product-card-meta min-w-0 flex-1">
              {latestCoaUrl ? (
                <CoaPurityButton
                  label={purityLabel}
                  fileUrl={latestCoaUrl}
                  className="text-xs"
                />
              ) : (
                <p className="truncate text-xs text-muted-foreground">{purityLabel}</p>
              )}
            </div>
          </div>
        )}

        <div className="product-card-foot-row product-card-foot-row--top">
          <span className="text-xs text-muted-foreground">Per vial</span>
          <Link
            href={productHref}
            className="product-card-price shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label={`${product.name}, ${product.priceCents} cents per 10 vials`}
          >
            <ProductPrice blockPriceCents={product.priceCents} size="sm" />
          </Link>
        </div>

        <div className="product-card-foot-row product-card-foot-row--bottom">
          {showCart ? (
            <AddToCartControls productId={product.id} stock={product.stock} layout="inline" />
          ) : product.stock > 0 ? (
            <p className="product-card-cart-note">{ORDER_QTY_MIN_NOTE}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
