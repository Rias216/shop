"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  applyAllSuggestions,
  buildProductSuggestions,
  PRODUCT_CATEGORIES,
  purityToFormMode,
} from "@/lib/admin-product-suggestions";
import {
  checkProductDraftAction,
  deleteProductAction,
  saveProductAction,
} from "@/lib/admin-actions";
import { ORDER_QTY_STEP } from "@/lib/order-qty";
import { inferCategoryFromProductName } from "@/lib/product-categories";
import { skuBaseFromName, slugFromName } from "@/lib/product-identifiers";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type { Product, ProductCategory } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

const PURITY_OPTIONS = [
  { value: "__none__", label: "Not specified" },
  { value: "≥99%", label: "≥99%" },
  { value: "≥98%", label: "≥98%" },
  { value: "≥97%", label: "≥97%" },
  { value: "≥99.5%", label: "≥99.5%" },
  { value: "__custom__", label: "Custom…" },
] as const;

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--outline-strong)] bg-[var(--glass-bg-subtle)] px-3 text-sm";
const textareaClass =
  "min-h-[8rem] w-full rounded-lg border border-[var(--outline-strong)] bg-[var(--glass-bg-subtle)] px-3 py-2 text-sm";

type Props = {
  product?: Product;
  error?: string;
  saved?: boolean;
  defaultLegalNotice?: string;
};

type StepId = "identity" | "pricing" | "details" | "legal";

const STEPS: { id: StepId; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "pricing", label: "Pricing & stock" },
  { id: "details", label: "Details" },
  { id: "legal", label: "Legal & review" },
];

export function ProductWizard({ product, error, saved, defaultLegalNotice }: Props) {
  const isNew = !product;
  const initialPurity = purityToFormMode(product?.purity);

  // State (lifted from old form)
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "GLP1_METABOLIC");
  const [groupKey, setGroupKey] = useState(product?.groupKey ?? "");
  const [variantLabel, setVariantLabel] = useState(product?.variantLabel ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceUsd, setPriceUsd] = useState(
    product ? (product.priceCents / 100).toFixed(2) : "",
  );
  const [stock, setStock] = useState(String(product?.stock ?? 100));
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [purityMode, setPurityMode] = useState(initialPurity.mode);
  const [customPurity, setCustomPurity] = useState(initialPurity.custom);
  const [casNumber, setCasNumber] = useState(product?.casNumber ?? "");
  const [legalNotice, setLegalNotice] = useState(product?.legalNotice ?? "");
  const [useDefaultLegalNotice, setUseDefaultLegalNotice] = useState(
    isNew || !product?.legalNotice,
  );
  const [skuOverride, setSkuOverride] = useState(product?.sku ?? "");

  const [stepIdx, setStepIdx] = useState(0);
  const [duplicateName, setDuplicateName] = useState(false);
  const [, startDupTransition] = useTransition();

  const inferredCategory = useMemo(
    () => (isNew && name.trim() ? inferCategoryFromProductName(name) : null),
    [isNew, name],
  );

  const effectiveCategory = inferredCategory ?? category;

  useEffect(() => {
    if (isNew && inferredCategory && inferredCategory !== category) {
      setCategory(inferredCategory);
    }
  }, [isNew, inferredCategory, category]);

  const stockNum = Number(stock);

  const runDuplicateCheck = useDebouncedCallback((nextName: string) => {
    if (!nextName.trim()) {
      setDuplicateName(false);
      return;
    }
    startDupTransition(async () => {
      const result = await checkProductDraftAction({
        name: nextName,
        excludeProductId: product?.id,
      });
      setDuplicateName(result.duplicateName);
    });
  }, 400);

  useEffect(() => {
    runDuplicateCheck(name);
  }, [name, runDuplicateCheck]);

  const slugPreview = useMemo(() => (name.trim() ? slugFromName(name) : "—"), [name]);
  const skuPreview = useMemo(
    () => (name.trim() ? skuBaseFromName(name, inferredCategory ?? category) : "—"),
    [name, category, inferredCategory],
  );

  const suggestions = useMemo(
    () =>
      buildProductSuggestions({
        name,
        category,
        stock: Number.isFinite(stockNum) ? stockNum : undefined,
      }),
    [name, category, stockNum],
  );

  const hasSuggestions = Boolean(
    suggestions.description ||
      suggestions.purity ||
      suggestions.casNumber ||
      suggestions.stock,
  );

  const fillFromSuggestions = useCallback(() => {
    const patch = applyAllSuggestions(suggestions);
    if (patch.category) setCategory(patch.category);
    if (patch.description) setDescription(patch.description);
    if (patch.purity) {
      const { mode, custom } = purityToFormMode(patch.purity);
      setPurityMode(mode);
      setCustomPurity(custom);
    }
    if (patch.casNumber) setCasNumber(patch.casNumber);
    if (patch.stock !== undefined) setStock(String(patch.stock));
  }, [suggestions]);

  const stepValid: Record<StepId, boolean> = useMemo(() => {
    const price = Number(priceUsd);
    const stockValid =
      Number.isFinite(stockNum) && stockNum >= ORDER_QTY_STEP && stockNum % ORDER_QTY_STEP === 0;
    const purityOk =
      purityMode === "__none__" ||
      (purityMode === "__custom__" ? customPurity.trim().length > 0 : true);

    return {
      identity: name.trim().length > 0 && !duplicateName,
      pricing: Number.isFinite(price) && price >= 0 && stockValid,
      details: description.trim().length > 0 && purityOk,
      legal: true,
    };
  }, [name, duplicateName, priceUsd, stockNum, description, purityMode, customPurity]);

  const allValid = Object.values(stepValid).every(Boolean);
  const purityHiddenValue =
    purityMode === "__custom__" ? customPurity : purityMode === "__none__" ? "__none__" : purityMode;

  const goTo = (idx: number) => setStepIdx(Math.max(0, Math.min(STEPS.length - 1, idx)));
  const onLastStep = stepIdx === STEPS.length - 1;

  return (
    <div className="mt-6">
      {saved && (
        <p className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-800 dark:text-green-200">
          Product saved.
        </p>
      )}
      {error === "duplicate" && (
        <p className="mb-4 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-2 text-sm text-[var(--warning-text)]">
          SKU or URL already in use — adjust the name or set a custom SKU.
        </p>
      )}
      {error === "validation" && (
        <p className="mb-4 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-2 text-sm text-[var(--warning-text)]">
          Could not save product. Check required fields, category, and stock (multiples of 10).
        </p>
      )}

      <form action={saveProductAction} className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {product && <input type="hidden" name="id" value={product.id} />}

        {/* Hidden mirrors of every field so the server action sees everything regardless of current step */}
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="category" value={effectiveCategory} />
        <input type="hidden" name="groupKey" value={groupKey} />
        <input type="hidden" name="variantLabel" value={variantLabel} />
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="priceCents" value={priceUsd} />
        <input type="hidden" name="stock" value={stock} />
        <input type="hidden" name="purity" value={purityHiddenValue} />
        <input type="hidden" name="casNumber" value={casNumber} />
        <input type="hidden" name="sku" value={skuOverride} />
        <input type="hidden" name="legalNotice" value={legalNotice} />
        {useDefaultLegalNotice && (
          <input type="hidden" name="useDefaultLegalNotice" value="on" />
        )}
        {isActive && <input type="hidden" name="isActive" value="on" />}

        <div className="space-y-6">
          <StepHeader stepIdx={stepIdx} stepValid={stepValid} onJump={goTo} />

          {STEPS[stepIdx]!.id === "identity" && (
            <section className="glass-strong space-y-5 rounded-xl p-5">
              <p className="space-y-1.5">
                <Label htmlFor="name-input">Product name</Label>
                <input
                  id="name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Retatrutide 10mg Research Kit"
                  className={inputClass}
                />
                {duplicateName && (
                  <span className="block text-xs text-[var(--warning-text)]">
                    A product with this name already exists.
                  </span>
                )}
              </p>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Category</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PRODUCT_CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                        effectiveCategory === c.value
                          ? "border-accent bg-accent/10 ring-1 ring-accent/40"
                          : "border-[var(--outline-strong)] bg-[var(--glass-bg-subtle)] hover:border-accent/30",
                      )}
                    >
                      <span className="font-medium">{c.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {c.description}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-3 sm:grid-cols-2">
                <p className="space-y-1.5">
                  <Label htmlFor="groupKey">Group key (optional)</Label>
                  <Input
                    id="groupKey"
                    value={groupKey}
                    onChange={(e) => setGroupKey(e.target.value)}
                    placeholder="retatrutide"
                    className="h-11 font-mono text-sm"
                  />
                  <span className="text-xs text-muted-foreground">
                    Same key merges dosages on one card
                  </span>
                </p>
                <p className="space-y-1.5">
                  <Label htmlFor="variantLabel">Variant label (optional)</Label>
                  <Input
                    id="variantLabel"
                    value={variantLabel}
                    onChange={(e) => setVariantLabel(e.target.value)}
                    placeholder="10mg"
                    className="h-11"
                  />
                </p>
              </div>

              <div className="grid gap-3 text-xs font-mono text-muted-foreground sm:grid-cols-2">
                <p>
                  URL:{" "}
                  <span className="text-foreground">{isNew ? slugPreview : product.slug}</span>
                </p>
                <p>
                  SKU:{" "}
                  <span className="text-foreground">{isNew ? skuPreview : product.sku}</span>
                </p>
              </div>

              {isNew && (
                <p className="space-y-1.5">
                  <Label htmlFor="skuOverride">Custom SKU (optional)</Label>
                  <Input
                    id="skuOverride"
                    value={skuOverride}
                    onChange={(e) => setSkuOverride(e.target.value)}
                    placeholder={String(skuPreview)}
                    className="font-mono"
                  />
                </p>
              )}
            </section>
          )}

          {STEPS[stepIdx]!.id === "pricing" && (
            <section className="glass-strong space-y-5 rounded-xl p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <p className="space-y-1.5">
                  <Label htmlFor="priceInput">Price per 10 vials (USD)</Label>
                  <Input
                    id="priceInput"
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(e.target.value)}
                    required
                    className="h-11"
                  />
                  <span className="text-xs text-muted-foreground">
                    Shown as $X/vial and $Y/10 vials on the shop
                  </span>
                </p>
                <p className="space-y-1.5">
                  <Label htmlFor="stockInput">Stock (vials)</Label>
                  <Input
                    id="stockInput"
                    type="number"
                    min="0"
                    step={ORDER_QTY_STEP}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    className="h-11"
                  />
                  <span className="text-xs text-muted-foreground">
                    Multiples of {ORDER_QTY_STEP}
                  </span>
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Visible in catalog
              </label>
            </section>
          )}

          {STEPS[stepIdx]!.id === "details" && (
            <section className="glass-strong space-y-5 rounded-xl p-5">
              {isNew && hasSuggestions && (
                <Button type="button" variant="outline" size="sm" onClick={fillFromSuggestions}>
                  Auto-fill description & details
                </Button>
              )}

              <p className="space-y-1.5">
                <Label htmlFor="descInput">Description</Label>
                <textarea
                  id="descInput"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className={textareaClass}
                />
              </p>

              <p className="space-y-1.5">
                <Label htmlFor="purityInput">Purity</Label>
                <select
                  id="purityInput"
                  value={purityMode}
                  onChange={(e) => setPurityMode(e.target.value)}
                  className={inputClass}
                >
                  {PURITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {purityMode === "__custom__" && (
                  <Input
                    value={customPurity}
                    onChange={(e) => setCustomPurity(e.target.value)}
                    placeholder="≥98% HPLC"
                    className="mt-2"
                  />
                )}
              </p>

              <p className="space-y-1.5">
                <Label htmlFor="casInput">CAS number (optional)</Label>
                <Input
                  id="casInput"
                  value={casNumber}
                  onChange={(e) => setCasNumber(e.target.value)}
                  placeholder="e.g. 137525-51-0"
                />
              </p>
            </section>
          )}

          {STEPS[stepIdx]!.id === "legal" && (
            <section className="glass-strong space-y-5 rounded-xl p-5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useDefaultLegalNotice}
                  onChange={(e) => setUseDefaultLegalNotice(e.target.checked)}
                />
                Use store default legal notice
              </label>
              {useDefaultLegalNotice && defaultLegalNotice && (
                <p className="rounded-lg border border-[var(--outline)] bg-[var(--glass-bg-subtle)] p-3 text-xs leading-relaxed text-muted-foreground">
                  {defaultLegalNotice}
                </p>
              )}
              {!useDefaultLegalNotice && (
                <textarea
                  value={legalNotice}
                  onChange={(e) => setLegalNotice(e.target.value)}
                  rows={4}
                  placeholder="Custom legal notice for this product"
                  className={textareaClass}
                />
              )}

              <p className="text-xs text-muted-foreground">
                COA documents can be uploaded after saving from the product edit page.
              </p>
            </section>
          )}

          <div className="sticky bottom-0 -mx-2 mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--outline-strong)] bg-[var(--glass-bg-strong)] px-3 py-3 backdrop-blur">
            <Button
              type="button"
              variant="ghost"
              onClick={() => goTo(stepIdx - 1)}
              disabled={stepIdx === 0}
            >
              Back
            </Button>
            <span className="text-xs text-muted-foreground">
              Step {stepIdx + 1} of {STEPS.length}
            </span>
            {!onLastStep ? (
              <Button
                type="button"
                onClick={() => goTo(stepIdx + 1)}
                disabled={!stepValid[STEPS[stepIdx]!.id]}
              >
                Next
              </Button>
            ) : (
              <SaveButton isNew={isNew} canSubmit={allValid} />
            )}
          </div>
        </div>

        <PreviewCard
          name={name}
          category={category}
          priceUsd={priceUsd}
          stock={stock}
          skuPreview={isNew ? skuPreview : product?.sku ?? ""}
          variantLabel={variantLabel}
          purity={purityHiddenValue}
          allValid={allValid}
        />
      </form>

      {product && (
        <form action={deleteProductAction} className="mt-8 border-t border-[var(--divider)] pt-6">
          <input type="hidden" name="id" value={product.id} />
          <Button type="submit" variant="destructive" size="sm">
            Deactivate product
          </Button>
        </form>
      )}
    </div>
  );
}

function StepHeader({
  stepIdx,
  stepValid,
  onJump,
}: {
  stepIdx: number;
  stepValid: Record<StepId, boolean>;
  onJump: (idx: number) => void;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {STEPS.map((s, i) => {
        const active = i === stepIdx;
        const done = i < stepIdx && stepValid[s.id];
        const canJump = i <= stepIdx || (i === stepIdx + 1 && stepValid[STEPS[stepIdx]!.id]);
        return (
          <li key={s.id} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canJump}
              onClick={() => onJump(i)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors",
                active
                  ? "bg-accent text-white"
                  : done
                    ? "bg-accent/15 text-foreground"
                    : "bg-[var(--glass-bg-subtle)] text-muted-foreground",
                !canJump && "cursor-not-allowed opacity-60",
              )}
            >
              <span className="font-mono">{i + 1}</span>
              <span>{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <span className="text-muted-foreground/50" aria-hidden>
                ›
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function SaveButton({ isNew, canSubmit }: { isNew: boolean; canSubmit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={!canSubmit || pending}>
      {pending ? "Saving…" : isNew ? "Create product" : "Save changes"}
    </Button>
  );
}

function PreviewCard({
  name,
  category,
  priceUsd,
  stock,
  skuPreview,
  variantLabel,
  purity,
  allValid,
}: {
  name: string;
  category: ProductCategory;
  priceUsd: string;
  stock: string;
  skuPreview: string;
  variantLabel: string;
  purity: string;
  allValid: boolean;
}) {
  const price = Number(priceUsd);
  const perVial = Number.isFinite(price) && price > 0 ? price / ORDER_QTY_STEP : null;
  const categoryLabel =
    PRODUCT_CATEGORIES.find((c) => c.value === category)?.label ?? category;
  const purityLabel = purity && purity !== "__none__" ? purity : null;

  return (
    <aside className="glass-strong h-fit space-y-3 rounded-xl p-5 lg:sticky lg:top-24">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Live preview
      </h3>
      <div className="rounded-lg border border-[var(--outline-strong)] bg-[var(--glass-bg-subtle)] p-4">
        <p className="text-xs text-muted-foreground">{categoryLabel}</p>
        <p className="mt-1 text-sm font-medium leading-snug">
          {name.trim() || "Product name"}
          {variantLabel ? ` · ${variantLabel}` : ""}
        </p>
        {purityLabel && (
          <p className="mt-1 text-xs text-muted-foreground">{purityLabel}</p>
        )}
        <p className="mt-3 text-lg font-semibold tabular-nums text-price">
          {perVial != null ? `$${perVial.toFixed(2)} / vial` : "—"}
        </p>
        {price > 0 && (
          <p className="text-xs text-muted-foreground tabular-nums">
            ${price.toFixed(2)} / 10 vials
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Stock {stock ? `${stock} vials` : "—"} · SKU {skuPreview || "—"}
        </p>
      </div>
      {!allValid && (
        <p className="text-xs text-[var(--warning-text)]">
          Complete each step before saving.
        </p>
      )}
    </aside>
  );
}
