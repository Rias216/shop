import type { Product, CoaDocument, ProductCategory } from "@/generated/prisma/client";
import type { ProductRatingSummary } from "@/lib/reviews";
import { unitPricePerVialCents } from "@/lib/pricing";
import { canOrderProduct } from "@/lib/order-qty";

export type ProductWithCoa = Product & {
  coaDocuments: Pick<
    CoaDocument,
    "id" | "fileUrl" | "batchCode" | "issuedAt" | "labName"
  >[];
};

export type ProductGroup = {
  key: string;
  displayName: string;
  category: ProductCategory;
  variants: ProductWithCoa[];
  defaultVariant: ProductWithCoa;
  hasMultipleVariants: boolean;
};

export function parseStrengthMg(variant: ProductWithCoa): number {
  const fromLabel = variant.variantLabel?.match(/(\d+(?:\.\d+)?)/);
  if (fromLabel) return Number(fromLabel[1]);
  const fromSlug = variant.slug.match(/(\d+(?:\.\d+)?)mg/i);
  if (fromSlug) return Number(fromSlug[1]);
  const fromName = variant.name.match(/(\d+(?:\.\d+)?)\s*mg/i);
  if (fromName) return Number(fromName[1]);
  return 0;
}

export function displayNameFromProduct(product: Pick<Product, "name">): string {
  const stripped = product.name
    .replace(/\s+\d+(?:\.\d+)?\s*mg\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return stripped || product.name;
}

function sortVariants(a: ProductWithCoa, b: ProductWithCoa): number {
  return parseStrengthMg(a) - parseStrengthMg(b);
}

function pickDefaultVariant(variants: ProductWithCoa[]): ProductWithCoa {
  const orderable = variants.filter((v) => canOrderProduct(v.stock));
  const pool = orderable.length > 0 ? orderable : variants;
  return [...pool].sort(sortVariants)[0] ?? variants[0]!;
}

export function groupCatalogProducts(products: ProductWithCoa[]): ProductGroup[] {
  const byKey = new Map<string, ProductWithCoa[]>();

  for (const product of products) {
    const key = product.groupKey ?? product.slug;
    const list = byKey.get(key) ?? [];
    list.push(product);
    byKey.set(key, list);
  }

  const groups: ProductGroup[] = [];

  for (const [key, variants] of byKey) {
    const sorted = [...variants].sort(sortVariants);
    const defaultVariant = pickDefaultVariant(sorted);
    groups.push({
      key,
      displayName: displayNameFromProduct(defaultVariant),
      category: defaultVariant.category,
      variants: sorted,
      defaultVariant,
      hasMultipleVariants: sorted.length > 1,
    });
  }

  return groups;
}

export function aggregateRatingForGroup(
  group: ProductGroup,
  summaries: Map<string, ProductRatingSummary>,
): ProductRatingSummary {
  let totalCount = 0;
  let weightedSum = 0;

  for (const v of group.variants) {
    const s = summaries.get(v.id);
    if (!s?.count || s.average == null) continue;
    totalCount += s.count;
    weightedSum += s.average * s.count;
  }

  if (totalCount === 0) return { average: null, count: 0 };
  return {
    average: Math.round((weightedSum / totalCount) * 10) / 10,
    count: totalCount,
  };
}

export function priceRangePerVialCents(group: ProductGroup): {
  min: number;
  max: number;
} {
  const prices = group.variants.map((v) => unitPricePerVialCents(v.priceCents));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export type CatalogSortSlug =
  | "new"
  | "popular"
  | "reviews"
  | "name"
  | "price-asc"
  | "price-desc";

export const CATALOG_SORT_OPTIONS: { value: CatalogSortSlug; label: string }[] = [
  { value: "new", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "reviews", label: "Top rated" },
  { value: "name", label: "Name (A–Z)" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function parseCatalogSort(sort: string | undefined): CatalogSortSlug {
  const valid = CATALOG_SORT_OPTIONS.map((o) => o.value);
  if (sort && valid.includes(sort as CatalogSortSlug)) return sort as CatalogSortSlug;
  return "new";
}

export function sortProductGroups(
  groups: ProductGroup[],
  sort: CatalogSortSlug,
  ctx: {
    popularRank: Map<string, number>;
    ratingByProductId: Map<string, ProductRatingSummary>;
  },
): ProductGroup[] {
  const groupSum = (g: ProductGroup, scorer: (v: ProductWithCoa) => number) =>
    g.variants.reduce((sum, v) => sum + scorer(v), 0);

  const sorted = [...groups];

  switch (sort) {
    case "name":
      return sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
    case "price-asc":
      return sorted.sort(
        (a, b) =>
          Math.min(...a.variants.map((v) => v.priceCents)) -
          Math.min(...b.variants.map((v) => v.priceCents)),
      );
    case "price-desc":
      return sorted.sort(
        (a, b) =>
          Math.max(...b.variants.map((v) => v.priceCents)) -
          Math.max(...a.variants.map((v) => v.priceCents)),
      );
    case "reviews":
      return sorted.sort((a, b) => {
        const ra = aggregateRatingForGroup(a, ctx.ratingByProductId);
        const rb = aggregateRatingForGroup(b, ctx.ratingByProductId);
        const avgDiff = (rb.average ?? 0) - (ra.average ?? 0);
        if (avgDiff !== 0) return avgDiff;
        return rb.count - ra.count;
      });
    case "popular":
      return sorted.sort((a, b) => {
        const pa = groupSum(a, (v) => ctx.popularRank.get(v.id) ?? 0);
        const pb = groupSum(b, (v) => ctx.popularRank.get(v.id) ?? 0);
        if (pb !== pa) return pb - pa;
        return (
          Math.max(...b.variants.map((v) => v.createdAt.getTime())) -
          Math.max(...a.variants.map((v) => v.createdAt.getTime()))
        );
      });
    case "new":
    default:
      return sorted.sort(
        (a, b) =>
          Math.max(...b.variants.map((v) => v.createdAt.getTime())) -
          Math.max(...a.variants.map((v) => v.createdAt.getTime())),
      );
  }
}
