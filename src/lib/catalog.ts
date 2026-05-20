import type { Prisma, ProductCategory } from "@/generated/prisma/client";
import {
  type CatalogFilterSlug,
  resolveCatalogCategories,
} from "@/lib/product-categories";

export type { ProductCategory, CatalogFilterSlug };
export { resolveCatalogCategories, parseCatalogFilterSlug } from "@/lib/product-categories";

import type { CatalogSortSlug } from "@/lib/product-groups";

export type CatalogSearchParams = {
  category?: string;
  q?: string;
  sort?: string;
};

export type { CatalogSortSlug };
export { CATALOG_SORT_OPTIONS, parseCatalogSort } from "@/lib/product-groups";

export function buildCatalogWhere(
  params: CatalogSearchParams,
): Prisma.ProductWhereInput {
  const categories = resolveCatalogCategories(params.category);
  const q = params.q?.trim();

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(categories?.length ? { category: { in: categories } } : {}),
  };

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { sku: { contains: q } },
      { casNumber: { contains: q } },
    ];
  }

  return where;
}

export function catalogHref(params: {
  category?: CatalogFilterSlug | ProductCategory | string;
  q?: string;
  sort?: CatalogSortSlug | string;
}): string {
  const sp = new URLSearchParams();
  if (params.category) sp.set("category", params.category);
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.sort && params.sort !== "new") sp.set("sort", params.sort);
  const query = sp.toString();
  return query ? `/catalog?${query}` : "/catalog";
}
