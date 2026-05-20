import type { ProductCategory } from "@/generated/prisma/client";
import {
  getCategoryMeta,
  inferCategoryFromProductName,
  PRODUCT_CATEGORIES,
} from "@/lib/product-categories";
import { ORDER_QTY_STEP } from "@/lib/order-qty";

export type FieldSuggestion<T> = {
  value: T;
  confidence: "high" | "medium" | "low";
  reason: string;
};

export type ProductSuggestions = {
  category?: FieldSuggestion<ProductCategory>;
  description?: FieldSuggestion<string>;
  purity?: FieldSuggestion<string>;
  casNumber?: FieldSuggestion<string>;
  stock?: FieldSuggestion<number>;
};

const KIT = "5 vials/kit";

function descriptionFor(name: string, category: ProductCategory): string {
  const meta = getCategoryMeta(category);
  const mgMatch = name.match(/(\d+(?:\.\d+)?)\s*mg/i);
  const mg = mgMatch ? `${mgMatch[1]}mg/vial` : "lyophilized research grade";

  if (category === "SUPPLIES") {
    return `${name.trim()} for laboratory reconstitution. Research use only. Not for human or veterinary use.`;
  }

  return `${name.split(/\s+\d/)[0]?.trim() || name} for in-vitro laboratory research only. ${meta.description}. ${mg}, ${KIT}. ≥98% purity by HPLC where applicable.`;
}

const CAS_HINTS: Record<string, string> = {
  bpc: "137525-51-0",
  semaglutide: "910463-68-2",
  epithalon: "307297-39-8",
};

export function inferCategoryFromName(name: string): FieldSuggestion<ProductCategory> {
  const value = inferCategoryFromProductName(name);
  const meta = getCategoryMeta(value);
  return {
    value,
    confidence: "high",
    reason: `Matches ${meta.label}`,
  };
}

export function suggestPurity(category: ProductCategory): FieldSuggestion<string> {
  const value = category === "SUPPLIES" ? "≥99%" : "≥98%";
  return {
    value,
    confidence: "medium",
    reason: `Typical for ${getCategoryMeta(category).shortLabel}`,
  };
}

export function suggestCasFromName(name: string): FieldSuggestion<string> | undefined {
  const n = name.toLowerCase();
  for (const [key, cas] of Object.entries(CAS_HINTS)) {
    if (n.includes(key)) {
      return { value: cas, confidence: "medium", reason: `Known CAS for ${key}` };
    }
  }
  return undefined;
}

export function suggestStock(): FieldSuggestion<number> {
  return {
    value: 100,
    confidence: "medium",
    reason: `Default catalog stock (${ORDER_QTY_STEP} vials per step)`,
  };
}

export function buildProductSuggestions(input: {
  name: string;
  category: ProductCategory;
  stock?: number;
}): ProductSuggestions {
  const name = input.name.trim();
  if (!name) return {};

  const suggestions: ProductSuggestions = {};
  const inferred = inferCategoryFromName(name);

  if (inferred.value !== input.category) {
    suggestions.category = { ...inferred, confidence: "medium" };
  }

  const effectiveCategory = inferred.value;
  suggestions.description = {
    value: descriptionFor(name, effectiveCategory),
    confidence: "high",
    reason: "Standard research kit wording",
  };

  suggestions.purity = suggestPurity(effectiveCategory);

  const cas = suggestCasFromName(name);
  if (cas) suggestions.casNumber = cas;

  if (input.stock === undefined || input.stock < ORDER_QTY_STEP) {
    suggestions.stock = suggestStock();
  }

  return suggestions;
}

function isHighConfidence<T>(s?: FieldSuggestion<T>): boolean {
  return s?.confidence === "high";
}

export function applyHighConfidenceSuggestions(suggestions: ProductSuggestions): Partial<{
  category: ProductCategory;
  description: string;
  purity: string;
  casNumber: string;
  stock: number;
}> {
  const out: Partial<{
    category: ProductCategory;
    description: string;
    purity: string;
    casNumber: string;
    stock: number;
  }> = {};
  if (isHighConfidence(suggestions.category)) out.category = suggestions.category!.value;
  if (isHighConfidence(suggestions.description)) out.description = suggestions.description!.value;
  if (isHighConfidence(suggestions.purity)) out.purity = suggestions.purity!.value;
  if (isHighConfidence(suggestions.casNumber)) out.casNumber = suggestions.casNumber!.value;
  if (isHighConfidence(suggestions.stock)) out.stock = suggestions.stock!.value;
  return out;
}

export function applyAllSuggestions(suggestions: ProductSuggestions): Partial<{
  category: ProductCategory;
  description: string;
  purity: string;
  casNumber: string;
  stock: number;
}> {
  const out: Partial<{
    category: ProductCategory;
    description: string;
    purity: string;
    casNumber: string;
    stock: number;
  }> = {};
  if (suggestions.category) out.category = suggestions.category.value;
  if (suggestions.description) out.description = suggestions.description.value;
  if (suggestions.purity) out.purity = suggestions.purity.value;
  if (suggestions.casNumber) out.casNumber = suggestions.casNumber.value;
  if (suggestions.stock) out.stock = suggestions.stock.value;
  return out;
}

export function purityToFormMode(purity: string | null | undefined): {
  mode: string;
  custom: string;
} {
  if (!purity?.trim()) return { mode: "__none__", custom: "" };
  const known = ["≥99%", "≥98%", "≥97%", "≥99.5%"];
  if (known.includes(purity)) return { mode: purity, custom: "" };
  return { mode: "__custom__", custom: purity };
}

export { PRODUCT_CATEGORIES };
