"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AddToCartControls } from "@/components/shop/add-to-cart-controls";
import { CoaPurityButton } from "@/components/shop/coa-purity-button";
import { ProductCard } from "@/components/shop/product-card";
import { ProductGraphic } from "@/components/shop/product-graphic";
import { ProductPrice } from "@/components/shop/product-price";
import { ProductStars } from "@/components/shop/product-stars";
import { formatPurityLabel, getLatestCoa } from "@/lib/coa";
import { ORDER_QTY_MIN_NOTE, canOrderProduct } from "@/lib/order-qty";
import type { ProductGroup } from "@/lib/product-groups";
import type { ProductRatingSummary } from "@/lib/reviews";
import { cn } from "@/lib/utils";

type Props = {
  group: ProductGroup;
  ratingSummary: ProductRatingSummary;
  className?: string;
};

export function GroupedProductCard({ group, ratingSummary, className }: Props) {
  if (!group.hasMultipleVariants) {
    const product = group.defaultVariant;
    return (
      <div className={className}>
        <ProductCard
          product={product}
          latestCoaUrl={getLatestCoa(product.coaDocuments)?.fileUrl}
          ratingSummary={ratingSummary}
        />
      </div>
    );
  }

  return (
    <GroupedProductCardMulti group={group} ratingSummary={ratingSummary} className={className} />
  );
}

function GroupedProductCardMulti({ group, ratingSummary, className }: Props) {
  const [selectedId, setSelectedId] = useState(group.defaultVariant.id);

  const selected = useMemo(
    () => group.variants.find((v) => v.id === selectedId) ?? group.defaultVariant,
    [group, selectedId],
  );

  const productHref = `/products/${selected.slug}`;
  const latestCoaUrl = getLatestCoa(selected.coaDocuments)?.fileUrl;
  const purityLabel = selected.purity ? formatPurityLabel(selected.purity) : null;
  const showCart = canOrderProduct(selected.stock);
  const graphicProduct = group.defaultVariant;

  return (
    <div className={cn("product-card glass glass-hover group flex flex-col overflow-hidden", className)}>
      <Link
        href={productHref}
        prefetch={false}
        className="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40"
      >
        <ProductGraphic
          slug={graphicProduct.slug}
          name={group.displayName}
          sku={graphicProduct.sku}
          category={group.category}
          variantLabel={selected.variantLabel}
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
          <h3>{group.displayName}</h3>
        </Link>

        <div className="product-card-stars">
          <ProductStars summary={ratingSummary} size="sm" showCount={Boolean(ratingSummary.count)} />
        </div>

        {purityLabel && (
          <div className="product-card-row">
            <div className="product-card-meta min-w-0 flex-1">
              {latestCoaUrl ? (
                <CoaPurityButton label={purityLabel} fileUrl={latestCoaUrl} className="text-xs" />
              ) : (
                <p className="truncate text-xs text-muted-foreground">{purityLabel}</p>
              )}
            </div>
          </div>
        )}

        <div className="product-card-foot-row product-card-foot-row--top">
          <label className="sr-only" htmlFor={`dosage-${group.key}`}>
            Dosage
          </label>
          <select
            id={`dosage-${group.key}`}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="variant-select"
          >
            {group.variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock === 0}>
                {v.variantLabel ?? v.name}
                {v.stock === 0 ? " — out of stock" : ""}
              </option>
            ))}
          </select>
          <ProductPrice blockPriceCents={selected.priceCents} size="sm" className="shrink-0" />
        </div>

        <div className="product-card-foot-row product-card-foot-row--bottom">
          {showCart ? (
            <AddToCartControls
              key={selected.id}
              productId={selected.id}
              stock={selected.stock}
              layout="inline"
            />
          ) : selected.stock > 0 ? (
            <p className="product-card-cart-note">{ORDER_QTY_MIN_NOTE}</p>
          ) : (
            <p className="product-card-cart-note">Out of stock</p>
          )}
        </div>
      </div>
    </div>
  );
}

