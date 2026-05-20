import { ProductStars } from "@/components/shop/product-stars";
import { ReviewForm } from "@/components/shop/review-form";
import type { ProductRatingSummary } from "@/lib/reviews";

import type { ApprovedReview } from "@/lib/reviews";

export function ProductReviews({
  productId,
  summary,
  reviews,
}: {
  productId: string;
  summary: ProductRatingSummary;
  reviews: ApprovedReview[];
}) {
  return (
    <section id="reviews" className="mt-10 border-t border-[var(--divider)] pt-10 scroll-mt-24">
      <h2 className="text-xl font-semibold text-foreground">Customer reviews</h2>
      <div className="mt-3">
        <ProductStars summary={summary} size="md" />
      </div>

      {reviews.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="glass-subtle rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{review.authorName}</p>
                  {review.verifiedPurchase && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Verified purchase
                    </span>
                  )}
                </div>
                <time
                  dateTime={review.createdAt.toISOString()}
                  className="text-xs text-muted-foreground"
                >
                  {review.createdAt.toLocaleDateString()}
                </time>
              </div>
              <ProductStars
                summary={{ average: review.rating, count: 1 }}
                size="sm"
                showCount={false}
                className="mt-2"
              />
              {review.title && (
                <p className="mt-2 font-medium text-foreground">{review.title}</p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No published reviews yet. Be the first to share your experience.
        </p>
      )}

      <div className="mt-8">
        <h3 className="mb-4 text-lg font-medium text-foreground">Write a review</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Reviews are moderated before they appear. Use the same email as your order to earn a
          verified purchase badge.
        </p>
        <ReviewForm productId={productId} />
      </div>
    </section>
  );
}
