"use client";

import { useMemo, useState } from "react";
import { AddToCartControls } from "@/components/shop/add-to-cart-controls";
import { CoaPurityButton } from "@/components/shop/coa-purity-button";
import { ProductPrice } from "@/components/shop/product-price";
import { ProductStars } from "@/components/shop/product-stars";
import { formatPurityLabel, getLatestCoa } from "@/lib/coa";
import { ORDER_QTY_MIN_NOTE, ORDER_QTY_STOCK_NOTE, canOrderProduct } from "@/lib/order-qty";
import { displayNameFromProduct, type ProductWithCoa } from "@/lib/product-groups";
import type { ProductRatingSummary } from "@/lib/reviews";

type Props = {
  variants: ProductWithCoa[];
  initialProductId: string;
  ratingSummary: ProductRatingSummary;
  defaultLegalNotice: string;
};

export function ProductVariantPicker({
  variants,
  initialProductId,
  ratingSummary,
  defaultLegalNotice,
}: Props) {
  const sorted = useMemo(
    () => [...variants].sort((a, b) => {
      const la = a.variantLabel ?? "";
      const lb = b.variantLabel ?? "";
      return la.localeCompare(lb, undefined, { numeric: true });
    }),
    [variants],
  );

  const [selectedId, setSelectedId] = useState(initialProductId);
  const selected = sorted.find((v) => v.id === selectedId) ?? sorted[0]!;
  const displayName = displayNameFromProduct(selected);
  const latestCoa = getLatestCoa(selected.coaDocuments);
  const hasMultiple = sorted.length > 1;

  return (
    <section className="glass-strong flex flex-col p-8">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Research only
      </span>
      <h1 className="mt-3 text-3xl font-medium text-foreground">{displayName}</h1>
      <ProductStars summary={ratingSummary} size="md" className="mt-3" />

      {hasMultiple && (
        <div className="mt-4">
          <label htmlFor="product-dosage" className="text-sm font-medium text-foreground">
            Dosage
          </label>
          <select
            id="product-dosage"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="variant-select mt-1.5 w-full max-w-xs"
          >
            {sorted.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock === 0}>
                {v.variantLabel ?? v.name}
                {v.stock === 0 ? " — out of stock" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-3">
        <ProductPrice blockPriceCents={selected.priceCents} size="md" className="items-start" />
      </div>

      {selected.purity && (
        <div className="mt-3">
          {latestCoa ? (
            <CoaPurityButton
              label={formatPurityLabel(selected.purity)}
              fileUrl={latestCoa.fileUrl}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{formatPurityLabel(selected.purity)}</p>
          )}
        </div>
      )}
      {selected.casNumber && (
        <p className="text-sm text-muted-foreground">CAS {selected.casNumber}</p>
      )}
      <p className="text-sm text-muted-foreground/80">SKU {selected.sku}</p>
      <p className="mt-6 leading-relaxed text-muted-foreground">{selected.description}</p>
      <p className="mt-4 rounded-md border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4 text-xs leading-relaxed text-[var(--warning-text)]">
        {selected.legalNotice ?? defaultLegalNotice}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        {selected.stock > 0 ? ORDER_QTY_STOCK_NOTE(selected.stock) : "Out of stock"}
      </p>
      {canOrderProduct(selected.stock) && (
        <AddToCartControls
          key={selected.id}
          productId={selected.id}
          stock={selected.stock}
          buttonSize="lg"
          className="mt-6 w-full justify-start sm:justify-end"
        />
      )}
      {selected.stock > 0 && !canOrderProduct(selected.stock) && (
        <p className="mt-4 text-sm text-muted-foreground">{ORDER_QTY_MIN_NOTE} (not enough stock).</p>
      )}

      {selected.coaDocuments.length > 0 && (
        <section className="mt-8 border-t border-[var(--divider)] pt-6">
          <h2 className="text-sm font-semibold text-foreground">Certificates of Analysis</h2>
          <ul className="mt-3 space-y-2">
            {selected.coaDocuments.map((coa) => (
              <li
                key={coa.id}
                className="glass-subtle flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="text-muted-foreground">
                  Batch {coa.batchCode}
                  {coa.labName && ` — ${coa.labName}`}
                </span>
                <a
                  href={coa.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

