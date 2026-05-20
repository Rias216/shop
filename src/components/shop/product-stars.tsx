import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductRatingSummary } from "@/lib/reviews";

type Props = {
  summary: ProductRatingSummary;
  size?: "sm" | "md";
  showCount?: boolean;
  className?: string;
};

function starFill(average: number, index: number): "full" | "half" | "empty" {
  const threshold = index + 1;
  if (average >= threshold) return "full";
  if (average >= threshold - 0.5) return "half";
  return "empty";
}

export function ProductStars({
  summary,
  size = "sm",
  showCount = true,
  className,
}: Props) {
  const iconSize = size === "md" ? "size-5" : "size-3.5";
  const displayAverage = summary.count > 0 ? (summary.average ?? 0) : 0;
  const roundedForStars = Math.round(displayAverage * 2) / 2;

  const label =
    summary.count > 0
      ? `Rated ${displayAverage.toFixed(1)} out of 5 from ${summary.count} review${summary.count === 1 ? "" : "s"}`
      : "No reviews yet";

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      aria-label={label}
      role="img"
    >
      <span className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => {
          const fill = summary.count > 0 ? starFill(roundedForStars, i) : "empty";
          return (
            <span key={i} className="relative inline-flex">
              <Star className={cn(iconSize, "text-muted-foreground/30")} aria-hidden />
              {(fill === "full" || fill === "half") && (
                <span
                  className={cn(
                    "absolute inset-0 overflow-hidden text-amber-500",
                    fill === "half" && "w-1/2",
                  )}
                >
                  <Star className={cn(iconSize, "fill-current")} aria-hidden />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {summary.count > 0 ? (
        <span className={cn("tabular-nums text-muted-foreground", size === "md" ? "text-sm" : "text-xs")}>
          {displayAverage.toFixed(1)}
          {showCount && (
            <span className="text-muted-foreground/80">
              {" "}
              ({summary.count})
            </span>
          )}
        </span>
      ) : (
        showCount && (
          <span className={cn("text-muted-foreground/60", size === "md" ? "text-sm" : "text-[0.65rem]")}>
            —
          </span>
        )
      )}
    </div>
  );
}
