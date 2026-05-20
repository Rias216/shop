"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReviewAction, type SubmitReviewState } from "@/lib/review-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

const initialState: SubmitReviewState = { ok: false, message: "" };

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [state, formAction] = useActionState(submitReviewAction, initialState);

  return (
    <form action={formAction} className="glass-subtle space-y-4 rounded-xl p-6">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating || ""} />

      <div>
        <Label htmlFor="review-author">Your name</Label>
        <Input id="review-author" name="authorName" required maxLength={80} className="mt-1.5" />
      </div>

      <div>
        <Label htmlFor="review-email">Email (optional)</Label>
        <Input
          id="review-email"
          name="authorEmail"
          type="email"
          maxLength={120}
          className="mt-1.5"
          autoComplete="email"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Rating</legend>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={cn(
                "pressable rounded p-0.5 transition-colors",
                value <= rating ? "text-amber-500" : "text-muted-foreground/40 hover:text-amber-400",
              )}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating === value}
            >
              <Star className={cn("size-7", value <= rating && "fill-current")} />
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input id="review-title" name="title" maxLength={120} className="mt-1.5" />
      </div>

      <div>
        <Label htmlFor="review-body">Review</Label>
        <textarea
          id="review-body"
          name="body"
          required
          minLength={20}
          maxLength={2000}
          rows={4}
          className="mt-1.5 flex w-full rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] px-4 py-2 text-sm text-foreground shadow-sm backdrop-blur-md placeholder:text-muted-foreground focus-visible:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
        />
        <p className="mt-1 text-xs text-muted-foreground">Minimum 20 characters.</p>
      </div>

      {state.message && (
        <p
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            state.ok
              ? "border-accent/30 bg-accent/10 text-foreground"
              : "border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]",
          )}
          role="status"
        >
          {state.message}
        </p>
      )}

      <SubmitButton pendingLabel="Submitting…" disabled={rating < 1}>
        Submit review
      </SubmitButton>
    </form>
  );
}
