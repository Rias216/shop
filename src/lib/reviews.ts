import { ReviewStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type ProductRatingSummary = {
  average: number | null;
  count: number;
};

const emptySummary = (): ProductRatingSummary => ({ average: null, count: 0 });

export async function getProductRatingSummary(
  productId: string,
): Promise<ProductRatingSummary> {
  const map = await getProductRatingSummaries([productId]);
  return map.get(productId) ?? emptySummary();
}

export async function getProductRatingSummaries(
  productIds: string[],
): Promise<Map<string, ProductRatingSummary>> {
  const result = new Map<string, ProductRatingSummary>();
  if (productIds.length === 0) return result;

  for (const id of productIds) {
    result.set(id, emptySummary());
  }

  const aggregates = await db.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, status: ReviewStatus.APPROVED },
    _avg: { rating: true },
    _count: { rating: true },
  });

  for (const row of aggregates) {
    const count = row._count.rating;
    result.set(row.productId, {
      average: count > 0 ? Math.round((row._avg.rating ?? 0) * 10) / 10 : null,
      count,
    });
  }

  return result;
}

export async function getVerifiedReviewerEmails(productId: string): Promise<Set<string>> {
  const rows = await db.orderItem.findMany({
    where: {
      productId,
      order: { paymentStatus: "COMPLETED" },
    },
    select: { order: { select: { email: true } } },
  });
  return new Set(rows.map((r) => r.order.email.toLowerCase()));
}

export type ApprovedReview = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: Date;
  verifiedPurchase: boolean;
};

export async function getApprovedReviews(productId: string): Promise<ApprovedReview[]> {
  const [reviews, verifiedEmails] = await Promise.all([
    db.review.findMany({
      where: { productId, status: ReviewStatus.APPROVED },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        authorName: true,
        authorEmail: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
      },
    }),
    getVerifiedReviewerEmails(productId),
  ]);

  return reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt,
    verifiedPurchase: Boolean(
      r.authorEmail && verifiedEmails.has(r.authorEmail.toLowerCase()),
    ),
  }));
}

export async function getPendingReviewCount() {
  return db.review.count({ where: { status: ReviewStatus.PENDING } });
}
