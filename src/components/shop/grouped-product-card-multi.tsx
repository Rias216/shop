"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AddToCartControls } from "@/components/shop/add-to-cart-controls";
import { CoaPurityButton } from "@/components/shop/coa-purity-button";
import { ProductGraphic } from "@/components/shop/product-graphic";
import { ProductPrice } from "@/components/shop/product-price";
import { ProductStars } from "@/components/shop/product-stars";
import { formatPurityLabel } from "@/lib/coa";
import { ORDER_QTY_MIN_NOTE, canOrderProduct } from "@/lib/order-qty";
import type { ProductCategory } from "@/generated/prisma/client";
import type { ProductRatingSummary } from "@/lib/reviews";
import { cn } from "@/lib/utils";

export type MultiVariantPreview = {
  id: string;
  slug: string;
  name: string;
  variantLabel: string | null;
  priceCents: number;
  stock: number;
  purity: string | null;
  sku: string;
  latestCoaUrl?: string;
};

export type MultiGroupPreview = {
  key: string;
  displayName: string;
  category: ProductCategory;
  graphicSlug: string;
  graphicSku: string;
  variants: MultiVariantPreview[];
  defaultVariantId: string;
};

type Props = {
  group: MultiGroupPreview;
  ratingSummary: ProductRatingSummary;
  className?: string;
};

export function GroupedProductCardMulti({ group, ratingSummary, className }: Props) {
  const [selectedId, setSelectedId] = useState(group.defaultVariantId);

  const selected = useMemo(
    () => group.variants.find((v) => v.id === selectedId) ?? group.variants[0]!,
    [group.variants, selectedId],
  );

  const productHref = `/products/${selected.slug}`;
  const purityLabel = selected.purity ? formatPurityLabel(selected.purity) : null;
  const showCart = canOrderProduct(selected.stock);

  return (
    <div className={cn("product-card glass glass-hover group flex flex-col overflow-hidden", className)}>
      <Link
        href={productHref}
        prefetch={false}
        className="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40"
      >
        <ProductGraphic
          slug={group.graphicSlug}
          name={group.displayName}
          sku={group.graphicSku}
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
              {selected.latestCoaUrl ? (
                <CoaPurityButton label={purityLabel} fileUrl={selected.latestCoaUrl} className="text-xs" />
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
