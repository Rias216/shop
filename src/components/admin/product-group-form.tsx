"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProductGroupAction } from "@/lib/admin-actions";
import { PRODUCT_CATEGORIES } from "@/lib/admin-product-suggestions";
import { inferCategoryFromProductName } from "@/lib/product-categories";
import { slugFromName } from "@/lib/product-identifiers";
import type { ProductCategory } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

const PURITY_OPTIONS = [
  { value: "__none__", label: "Not specified" },
  { value: "≥99%", label: "≥99%" },
  { value: "≥98%", label: "≥98%" },
  { value: "≥97%", label: "≥97%" },
] as const;

const PRESETS: { label: string; values: number[] }[] = [
  { label: "GLP-1 ladder", values: [5, 10, 15, 20, 30] },
  { label: "Triple", values: [5, 10, 15] },
  { label: "Single 10mg", values: [10] },
];

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--outline-strong)] bg-[var(--glass-bg-subtle)] px-3 text-sm";
const textareaClass =
  "min-h-[7rem] w-full rounded-lg border border-[var(--outline-strong)] bg-[var(--glass-bg-subtle)] px-3 py-2 text-sm";

type Row = {
  uid: string;
  mg: string;
  priceUsd: string;
  stock: string;
};

function newRow(mg?: number): Row {
  return {
    uid: Math.random().toString(36).slice(2),
    mg: mg != null ? String(mg) : "",
    priceUsd: "",
    stock: "100",
  };
}

export function ProductGroupForm({
  error,
  defaultLegalNotice,
}: {
  error?: string;
  defaultLegalNotice?: string;
}) {
  const [base, setBase] = useState("");
  const [groupKey, setGroupKey] = useState("");
  const [category, setCategory] = useState<ProductCategory>("GLP1_METABOLIC");
  const [description, setDescription] = useState("");
  const [purity, setPurity] = useState<string>("≥98%");
  const [casNumber, setCasNumber] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [useDefaultLegal, setUseDefaultLegal] = useState(true);
  const [legalNotice, setLegalNotice] = useState("");
  const [rows, setRows] = useState<Row[]>([newRow(10)]);

  const effectiveGroupKey = useMemo(
    () => (groupKey.trim() || (base.trim() ? slugFromName(base) : "")).toLowerCase(),
    [groupKey, base],
  );

  const handleBaseChange = (value: string) => {
    setBase(value);
    if (value.trim()) setCategory(inferCategoryFromProductName(value));
  };

  const updateRow = (uid: string, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));
  };

  const removeRow = (uid: string) => {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.uid !== uid) : rs));
  };

  const applyPreset = (values: number[]) => {
    setRows(values.map((mg) => newRow(mg)));
  };

  const validRows = rows.filter((r) => {
    const mg = Number(r.mg);
    const price = Number(r.priceUsd);
    const stock = Number(r.stock);
    return (
      Number.isFinite(mg) &&
      mg > 0 &&
      Number.isFinite(price) &&
      price >= 0 &&
      Number.isFinite(stock) &&
      stock >= 0
    );
  });

  const canSubmit =
    base.trim().length > 0 &&
    description.trim().length > 0 &&
    validRows.length > 0;

  const variantsPayload = validRows.map((r) => ({
    mg: Number(r.mg),
    priceUsd: Number(r.priceUsd),
    stock: Number(r.stock),
  }));

  return (
    <div className="mt-6">
      {error === "duplicate" && (
        <p className="mb-4 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-2 text-sm text-[var(--warning-text)]">
          One or more SKUs or slugs collided. Change the base name or remove duplicate strengths.
        </p>
      )}

      <form action={saveProductGroupAction} className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {variantsPayload.map((v) => (
          <input key={v.mg} type="hidden" name="variants" value={JSON.stringify(v)} />
        ))}

        <div className="space-y-6">
          <section className="glass-strong space-y-5 rounded-xl p-5">
            <div>
              <h2 className="text-sm font-semibold">Group identity</h2>
              <p className="text-xs text-muted-foreground">
                Base compound name. Each variant becomes its own product sharing one group key.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <p className="space-y-1.5">
                <Label htmlFor="base">Base name</Label>
                <Input
                  id="base"
                  name="base"
                  value={base}
                  onChange={(e) => handleBaseChange(e.target.value)}
                  required
                  placeholder="Retatrutide"
                  className="h-11"
                />
              </p>
              <p className="space-y-1.5">
                <Label htmlFor="groupKey">Group key</Label>
                <Input
                  id="groupKey"
                  name="groupKey"
                  value={groupKey}
                  onChange={(e) => setGroupKey(e.target.value)}
                  placeholder={effectiveGroupKey || "auto"}
                  className="h-11 font-mono text-sm"
                />
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Category</legend>
              <input type="hidden" name="category" value={category} />
              <div className="grid gap-2 sm:grid-cols-2">
                {PRODUCT_CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      category === c.value
                        ? "border-accent bg-accent/10 ring-1 ring-accent/40"
                        : "border-[var(--outline-strong)] bg-[var(--glass-bg-subtle)] hover:border-accent/30",
                    )}
                  >
                    <span className="font-medium">{c.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="glass-strong space-y-4 rounded-xl p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">Variants</h2>
                <p className="text-xs text-muted-foreground">
                  Each row creates one product. Price is per 10 vials.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(p.values)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="hidden grid-cols-[1fr_1.2fr_1fr_auto] gap-2 px-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
                <span>Dosage (mg)</span>
                <span>Price / 10 vials</span>
                <span>Stock (vials)</span>
                <span className="sr-only">Remove</span>
              </div>
              {rows.map((r, idx) => (
                <div
                  key={r.uid}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--outline-strong)] bg-[var(--glass-bg-subtle)] p-2 sm:grid-cols-[1fr_1.2fr_1fr_auto]"
                >
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={r.mg}
                    onChange={(e) => updateRow(r.uid, { mg: e.target.value })}
                    placeholder="10"
                    aria-label={`Dosage ${idx + 1}`}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={r.priceUsd}
                    onChange={(e) => updateRow(r.uid, { priceUsd: e.target.value })}
                    placeholder="260.00"
                    aria-label={`Price ${idx + 1}`}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    value={r.stock}
                    onChange={(e) => updateRow(r.uid, { stock: e.target.value })}
                    placeholder="100"
                    aria-label={`Stock ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(r.uid)}
                    disabled={rows.length <= 1}
                    aria-label="Remove row"
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRows((rs) => [...rs, newRow()])}
              >
                Add dosage
              </Button>
            </div>
          </section>

          <section className="glass-strong space-y-5 rounded-xl p-5">
            <h2 className="text-sm font-semibold">Shared details</h2>
            <p className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className={textareaClass}
                placeholder="Used for every variant. Strength is appended automatically to the name."
              />
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <p className="space-y-1.5">
                <Label htmlFor="purity">Purity</Label>
                <select
                  id="purity"
                  name="purity"
                  value={purity}
                  onChange={(e) => setPurity(e.target.value)}
                  className={inputClass}
                >
                  {PURITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </p>
              <p className="space-y-1.5">
                <Label htmlFor="casNumber">CAS number (optional)</Label>
                <Input
                  id="casNumber"
                  name="casNumber"
                  value={casNumber}
                  onChange={(e) => setCasNumber(e.target.value)}
                  placeholder="e.g. 137525-51-0"
                />
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useDefaultLegal}
                onChange={(e) => setUseDefaultLegal(e.target.checked)}
              />
              Use store default legal notice
              {useDefaultLegal && (
                <input type="hidden" name="useDefaultLegalNotice" value="on" />
              )}
            </label>
            {useDefaultLegal && defaultLegalNotice && (
              <p className="rounded-lg border border-[var(--outline)] bg-[var(--glass-bg-subtle)] p-3 text-xs leading-relaxed text-muted-foreground">
                {defaultLegalNotice}
              </p>
            )}
            {!useDefaultLegal && (
              <textarea
                name="legalNotice"
                value={legalNotice}
                onChange={(e) => setLegalNotice(e.target.value)}
                rows={3}
                className={textareaClass}
                placeholder="Custom legal notice"
              />
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Visible in catalog on create
              {isActive && <input type="hidden" name="isActive" value="on" />}
            </label>
          </section>

          <SubmitRow canSubmit={canSubmit} count={validRows.length} />
        </div>

        <aside className="glass-strong h-fit space-y-3 rounded-xl p-5 lg:sticky lg:top-24">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Preview ({validRows.length})
          </h3>
          {validRows.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Fill at least one row with dosage and price.
            </p>
          ) : (
            <ul className="space-y-2">
              {validRows.map((r) => {
                const price = Number(r.priceUsd);
                const perVial = price > 0 ? price / 10 : null;
                return (
                  <li
                    key={r.uid}
                    className="rounded-lg border border-[var(--outline-strong)] bg-[var(--glass-bg-subtle)] p-3 text-xs"
                  >
                    <p className="font-medium">
                      {base.trim() || "Compound"} {r.mg}mg Research Kit
                    </p>
                    <p className="mt-1 tabular-nums text-muted-foreground">
                      {perVial != null ? `$${perVial.toFixed(2)} / vial` : "—"} · stock {r.stock || 0}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-[0.7rem] text-muted-foreground">
            Group key: <span className="font-mono">{effectiveGroupKey || "—"}</span>
          </p>
        </aside>
      </form>
    </div>
  );
}

function SubmitRow({ canSubmit, count }: { canSubmit: boolean; count: number }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--outline)] pt-5">
      <p className="text-xs text-muted-foreground">
        Will create {count} product{count === 1 ? "" : "s"} in one transaction.
      </p>
      <Button type="submit" size="lg" disabled={!canSubmit || pending}>
        {pending ? "Creating…" : `Create ${count} product${count === 1 ? "" : "s"}`}
      </Button>
    </div>
  );
}
