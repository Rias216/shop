import {
  approveReviewAction,
  deleteReviewAction,
  rejectReviewAction,
} from "@/lib/admin-review-actions";
import { Button } from "@/components/ui/button";
import type { ReviewStatus } from "@/generated/prisma/client";

export function ReviewModerationActions({
  reviewId,
  status,
}: {
  reviewId: string;
  status: ReviewStatus;
}) {
  return (
    <span className="flex flex-wrap gap-2">
      {status !== "APPROVED" && (
        <form action={approveReviewAction}>
          <input type="hidden" name="id" value={reviewId} />
          <Button type="submit" size="sm" variant="default">
            Approve
          </Button>
        </form>
      )}
      {status !== "REJECTED" && (
        <form action={rejectReviewAction}>
          <input type="hidden" name="id" value={reviewId} />
          <Button type="submit" size="sm" variant="outline">
            Reject
          </Button>
        </form>
      )}
      <form action={deleteReviewAction}>
        <input type="hidden" name="id" value={reviewId} />
        <Button type="submit" size="sm" variant="ghost">
          Delete
        </Button>
      </form>
    </span>
  );
}
