import { OrderStatus, ReviewStatus } from "@/generated/prisma/client";
import { buildCatalogWhere, type CatalogSearchParams } from "@/lib/catalog";
import {
  groupCatalogProducts,
  parseCatalogSort,
  parseStrengthMg,
  sortProductGroups,
  type ProductGroup,
  type ProductWithCoa,
} from "@/lib/product-groups";
import { getProductRatingSummaries } from "@/lib/reviews";
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { PRODUCT_CACHE_TAGS, productDetailSelect, productListSelect } from "@/lib/product-include";
import { cache } from "react";
import { createPagePerf } from "@/lib/perf";
import type { ProductRatingSummary } from "@/lib/reviews";

function orderByForSort(sort: ReturnType<typeof parseCatalogSort>) {
  switch (sort) {
    case "name":
      return { name: "asc" as const };
    case "price-asc":
      return { priceCents: "asc" as const };
    case "price-desc":
      return { priceCents: "desc" as const };
    case "new":
    default:
      return { createdAt: "desc" as const };
  }
}

async function fetchPopularRank(productIds: string[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const rows = await db.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { in: productIds },
      order: { status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED] } },
    },
    _sum: { qty: true },
  });
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.productId, row._sum.qty ?? 0);
  }
  return map;
}

export async function getCatalogProducts(params: CatalogSearchParams) {
  const sort = parseCatalogSort(params.sort);
  return db.product.findMany({
    where: buildCatalogWhere(params),
    orderBy: orderByForSort(sort),
    select: productListSelect,
  }) as Promise<ProductWithCoa[]>;
}

type CatalogGroupsPayload = {
  groups: ProductGroup[];
  ratingEntries: Array<[string, ProductRatingSummary]>;
};

function needsPopularRank(sort: ReturnType<typeof parseCatalogSort>) {
  return sort === "popular";
}

function needsReviewAggregation(sort: ReturnType<typeof parseCatalogSort>) {
  return sort === "reviews";
}

const getCatalogProductGroupsCached = unstable_cache(
  async (category?: string, q?: string, sort?: string): Promise<CatalogGroupsPayload> => {
    const { groups, ratingByProductId } = await getCatalogProductGroups({
      category,
      q,
      sort,
    });
    return {
      groups,
      ratingEntries: [...ratingByProductId.entries()],
    };
  },
  ["catalog-product-groups"],
  { revalidate: 180, tags: [PRODUCT_CACHE_TAGS.catalog] },
);

export async function getCatalogProductGroupsCachedByParams(params: CatalogSearchParams) {
  const category = params.category?.trim() || undefined;
  const q = params.q?.trim() || undefined;
  const sort = parseCatalogSort(params.sort);
  const payload = await getCatalogProductGroupsCached(category, q, sort);
  return {
    groups: payload.groups,
    ratingByProductId: new Map(payload.ratingEntries),
  };
}

export async function getCatalogProductGroups(
  params: CatalogSearchParams,
): Promise<{ groups: ProductGroup[]; ratingByProductId: Map<string, { average: number | null; count: number }> }> {
  const perf = createPagePerf("catalog.groups");
  const products = await perf.time("db.products", () => getCatalogProducts(params));
  const sort = parseCatalogSort(params.sort);
  const groups = groupCatalogProducts(products);
  const productIds = products.map((p) => p.id);
  const ratingByProductId = await perf.time("db.ratings", () =>
    getProductRatingSummaries(productIds),
  );
  const popularRank = needsPopularRank(sort)
    ? await perf.time("db.popular", () => fetchPopularRank(productIds))
    : new Map<string, number>();

  if (needsReviewAggregation(sort)) {
    const reviewAgg = await db.review.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds }, status: ReviewStatus.APPROVED },
      _avg: { rating: true },
      _count: { rating: true },
    });
    for (const row of reviewAgg) {
      const count = row._count.rating;
      ratingByProductId.set(row.productId, {
        average: count > 0 ? Math.round((row._avg.rating ?? 0) * 10) / 10 : null,
        count,
      });
    }
  }

  const result = {
    groups: sortProductGroups(groups, sort, { popularRank, ratingByProductId }),
    ratingByProductId,
  };
  perf.flush({ groups: result.groups.length, products: products.length });
  return result;
}

const getCatalogProductCountCached = unstable_cache(
  async (category?: string, q?: string) =>
    db.product.count({
      where: buildCatalogWhere({ category, q, sort: "new" }),
    }),
  ["catalog-product-count"],
  { revalidate: 180, tags: [PRODUCT_CACHE_TAGS.catalog] },
);

export async function getCatalogProductCount(params: CatalogSearchParams) {
  const category = params.category?.trim() || undefined;
  const q = params.q?.trim() || undefined;
  return getCatalogProductCountCached(category, q);
}

export const getProductVariantsByGroupKey = cache(async function getProductVariantsByGroupKey(
  groupKey: string,
): Promise<ProductWithCoa[]> {
  const rows = await db.product.findMany({
    where: { groupKey, isActive: true },
    select: productDetailSelect,
  });
  return (rows as ProductWithCoa[]).sort((a, b) => parseStrengthMg(a) - parseStrengthMg(b));
});
