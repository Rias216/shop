import Link from "next/link";
import { ReviewModerationActions } from "@/components/admin/review-moderation-actions";
import { ProductStars } from "@/components/shop/product-stars";
import { ReviewStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

const filters: { label: string; value?: ReviewStatus }[] = [
  { label: "All" },
  { label: "Pending", value: ReviewStatus.PENDING },
  { label: "Approved", value: ReviewStatus.APPROVED },
  { label: "Rejected", value: ReviewStatus.REJECTED },
];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const statusFilter =
    statusParam && Object.values(ReviewStatus).includes(statusParam as ReviewStatus)
      ? (statusParam as ReviewStatus)
      : undefined;

  const reviews = await db.review.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, slug: true } },
    },
  });

  const pendingCount = await db.review.count({
    where: { status: ReviewStatus.PENDING },
  });

  return (
    <article>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingCount} pending moderation
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const href = f.value ? `/admin/reviews?status=${f.value}` : "/admin/reviews";
            const active = statusFilter === f.value || (!statusFilter && !f.value);
            return (
              <Link
                key={f.label}
                href={href}
                className={cn(
                  "pressable rounded-md px-3 py-1.5 text-sm",
                  active
                    ? "bg-accent/15 font-medium text-accent"
                    : "text-muted-foreground hover:bg-[var(--nav-hover)] hover:text-foreground",
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No reviews in this filter.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="glass-strong rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {review.status}
                  </p>
                  <Link
                    href={`/products/${review.product.slug}`}
                    className="mt-1 font-medium text-accent hover:underline"
                  >
                    {review.product.name}
                  </Link>
                  <p className="mt-2 text-sm text-foreground">
                    <span className="font-medium">{review.authorName}</span>
                    {review.authorEmail && (
                      <span className="text-muted-foreground"> · {review.authorEmail}</span>
                    )}
                  </p>
                  <ProductStars
                    summary={{ average: review.rating, count: 1 }}
                    size="sm"
                    showCount={false}
                    className="mt-2"
                  />
                  {review.title && (
                    <p className="mt-2 font-medium text-foreground">{review.title}</p>
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {review.body}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Submitted {review.createdAt.toLocaleString()}
                  </p>
                </div>
                <ReviewModerationActions reviewId={review.id} status={review.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
