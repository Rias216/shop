import type { ProductCategory } from "@/generated/prisma/client";

export type CategoryMeta = {
  value: ProductCategory;
  label: string;
  shortLabel: string;
  description: string;
  skuPrefix: string;
  accent: string;
};

export type CatalogFilterSlug =
  | "weight-loss"
  | "cognitive"
  | "recovery"
  | "wellness"
  | "supplies";

export type CatalogFilter = {
  slug?: CatalogFilterSlug;
  label: string;
  description: string;
  categories: ProductCategory[];
};

export const CATALOG_FILTERS: CatalogFilter[] = [
  { label: "All", description: "Everything in stock", categories: [] },
  {
    slug: "weight-loss",
    label: "Weight loss",
    description: "GLP-1 and metabolic peptides",
    categories: ["GLP1_METABOLIC"],
  },
  {
    slug: "cognitive",
    label: "Cognitive",
    description: "Neuropeptides for lab research",
    categories: ["NEUROPEPTIDE"],
  },
  {
    slug: "recovery",
    label: "Recovery",
    description: "Growth and tissue-repair peptides",
    categories: ["GROWTH_SECRETAGOGUE", "HEALING_REPAIR"],
  },
  {
    slug: "wellness",
    label: "Wellness",
    description: "Longevity, mitochondrial, and specialty",
    categories: ["MITOCHONDRIAL", "LONGEVITY", "MELANOCORTIN"],
  },
  {
    slug: "supplies",
    label: "Supplies",
    description: "BAC water and lab supplies",
    categories: ["SUPPLIES"],
  },
];

const LEGACY_FILTER_SLUGS: Record<string, CatalogFilterSlug | undefined> = {
  peptides: "weight-loss",
  glp1: "weight-loss",
  metabolic: "weight-loss",
  cognitive: "cognitive",
  "growth-healing": "recovery",
  recovery: "recovery",
  more: "wellness",
  specialty: "wellness",
  wellness: "wellness",
  supplies: "supplies",
};

export const PRODUCT_CATEGORIES: CategoryMeta[] = [
  {
    value: "GLP1_METABOLIC",
    label: "Weight loss",
    shortLabel: "Weight loss",
    description: "GLP-1 research kits",
    skuPrefix: "GLP",
    accent: "#7c9ce0",
  },
  {
    value: "GROWTH_SECRETAGOGUE",
    label: "Growth",
    shortLabel: "Growth",
    description: "GH secretagogue research peptides",
    skuPrefix: "GH",
    accent: "#8fbc8f",
  },
  {
    value: "HEALING_REPAIR",
    label: "Recovery",
    shortLabel: "Recovery",
    description: "Tissue repair research",
    skuPrefix: "REP",
    accent: "#e8a87c",
  },
  {
    value: "MITOCHONDRIAL",
    label: "Mitochondrial",
    shortLabel: "Mito",
    description: "Mitochondrial research",
    skuPrefix: "MITO",
    accent: "#b8a9e8",
  },
  {
    value: "NEUROPEPTIDE",
    label: "Cognitive",
    shortLabel: "Cognitive",
    description: "Neuropeptides for lab research",
    skuPrefix: "NEU",
    accent: "#9ec5d4",
  },
  {
    value: "LONGEVITY",
    label: "Longevity",
    shortLabel: "Longevity",
    description: "Longevity research",
    skuPrefix: "LON",
    accent: "#d4a5c9",
  },
  {
    value: "MELANOCORTIN",
    label: "Wellness",
    shortLabel: "Wellness",
    description: "Specialty research peptides",
    skuPrefix: "MEL",
    accent: "#c9a86c",
  },
  {
    value: "SUPPLIES",
    label: "Supplies",
    shortLabel: "Supplies",
    description: "Lab supplies",
    skuPrefix: "SUP",
    accent: "#94a3b8",
  },
];

const byValue = new Map(PRODUCT_CATEGORIES.map((c) => [c.value, c]));

export const PRODUCT_CATEGORY_VALUES = PRODUCT_CATEGORIES.map((c) => c.value);

const filterBySlug = new Map(
  CATALOG_FILTERS.filter((f): f is CatalogFilter & { slug: CatalogFilterSlug } => Boolean(f.slug)).map(
    (f) => [f.slug, f],
  ),
);

export function getCategoryMeta(category: ProductCategory): CategoryMeta {
  return byValue.get(category) ?? PRODUCT_CATEGORIES[0]!;
}

export function getCategoryLabel(category: ProductCategory): string {
  return getCategoryMeta(category).shortLabel;
}

export function getCategoryFullLabel(category: ProductCategory): string {
  return getCategoryMeta(category).label;
}

export function getCategoryTextColor(category: ProductCategory): string {
  return getCategoryMeta(category).accent;
}

export function getCategorySkuPrefix(category: ProductCategory): string {
  return getCategoryMeta(category).skuPrefix;
}

function normalizeFilterSlug(category: string): CatalogFilterSlug | undefined {
  if (filterBySlug.has(category as CatalogFilterSlug)) {
    return category as CatalogFilterSlug;
  }
  return LEGACY_FILTER_SLUGS[category];
}

export function resolveCatalogCategories(
  category: string | undefined,
): ProductCategory[] | undefined {
  if (!category) return undefined;

  if (PRODUCT_CATEGORY_VALUES.includes(category as ProductCategory)) {
    return [category as ProductCategory];
  }

  const slug = normalizeFilterSlug(category);
  if (slug) {
    const group = filterBySlug.get(slug);
    if (group && group.categories.length > 0) return group.categories;
  }

  return undefined;
}

export function parseCatalogFilterSlug(
  category: string | undefined,
): CatalogFilterSlug | undefined {
  if (!category) return undefined;
  return normalizeFilterSlug(category);
}

export function parseCategoryFilter(
  category: string | undefined,
): ProductCategory | undefined {
  const list = resolveCatalogCategories(category);
  return list?.length === 1 ? list[0] : undefined;
}

export function inferCategoryFromProductName(name: string): ProductCategory {
  const n = name.toLowerCase();

  if (/bac\s*water|bacteriostatic/i.test(n)) return "SUPPLIES";
  if (/retatrutide|tirzepatide|semaglutide|glp/i.test(n)) return "GLP1_METABOLIC";
  if (/sermorelin|ipamorelin|cjc|ghrp/i.test(n)) return "GROWTH_SECRETAGOGUE";
  if (/bpc|tb-?500|tb5|kpv|blend/i.test(n)) return "HEALING_REPAIR";
  if (/mots-c|ss-?31|slu-pp|mitochondrial/i.test(n)) return "MITOCHONDRIAL";
  if (/semax|selank/i.test(n)) return "NEUROPEPTIDE";
  if (/epithalon/i.test(n)) return "LONGEVITY";
  if (/mt-?2|melanotan|melanocortin/i.test(n)) return "MELANOCORTIN";

  return "GLP1_METABOLIC";
}
