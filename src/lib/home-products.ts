import { unstable_cache } from "next/cache";
import { OrderStatus, ReviewStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  groupCatalogProducts,
  sortProductGroups,
  type ProductGroup,
  type ProductWithCoa,
} from "@/lib/product-groups";
import { PRODUCT_CACHE_TAGS, productListSelect } from "@/lib/product-include";
import { getProductRatingSummaries } from "@/lib/reviews";

async function fetchPopularRank(productIds: string[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const rows = await db.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { in: productIds },
      order: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED] },
      },
    },
    _sum: { qty: true },
  });
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.productId, row._sum.qty ?? 0);
  }
  return map;
}

async function productsByReviewFallback(limit: number): Promise<ProductWithCoa[]> {
  const aggregates = await db.review.groupBy({
    by: ["productId"],
    where: { status: ReviewStatus.APPROVED },
    _count: { rating: true },
    _avg: { rating: true },
  });
  aggregates.sort((a, b) => b._count.rating - a._count.rating);
  const top = aggregates.slice(0, limit * 3);

  if (top.length === 0) {
    return db.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: limit * 3,
      select: productListSelect,
    }) as Promise<ProductWithCoa[]>;
  }

  const ids = top.map((a) => a.productId);
  const products = await db.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: productListSelect,
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as ProductWithCoa[];
}

async function computePopularProductGroups(limit: number): Promise<ProductGroup[]> {
  const candidateProducts = await db.product.findMany({
    where: { isActive: true },
    select: productListSelect,
    take: limit * 8,
  });
  const products = candidateProducts as ProductWithCoa[];
  const productIds = products.map((p) => p.id);
  const popularRank = await fetchPopularRank(productIds);

  let rankedProducts: ProductWithCoa[];
  if (popularRank.size > 0) {
    rankedProducts = [...products]
      .sort((a, b) => (popularRank.get(b.id) ?? 0) - (popularRank.get(a.id) ?? 0))
      .slice(0, limit * 4);
  } else {
    rankedProducts = await productsByReviewFallback(limit);
  }

  const groups = groupCatalogProducts(rankedProducts);
  const ratingByProductId = await getProductRatingSummaries(
    rankedProducts.map((p) => p.id),
  );
  const sorted = sortProductGroups(groups, "popular", {
    popularRank,
    ratingByProductId,
  });
  return sorted.slice(0, limit);
}

async function computeNewArrivalGroups(limit: number): Promise<ProductGroup[]> {
  const products = (await db.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit * 4,
    select: productListSelect,
  })) as ProductWithCoa[];
  const groups = groupCatalogProducts(products);
  const ratingByProductId = await getProductRatingSummaries(products.map((p) => p.id));
  const sorted = sortProductGroups(groups, "new", {
    popularRank: new Map(),
    ratingByProductId,
  });
  return sorted.slice(0, limit);
}

export const getPopularProductGroups = unstable_cache(
  computePopularProductGroups,
  ["home-popular-groups"],
  { revalidate: 300, tags: [PRODUCT_CACHE_TAGS.homePopular] },
);

export const getNewArrivalGroups = unstable_cache(
  computeNewArrivalGroups,
  ["home-new-groups"],
  { revalidate: 300, tags: [PRODUCT_CACHE_TAGS.homeNew] },
);
