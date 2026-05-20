import { formatBlockPrice, formatPerVialPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type Props = {
  blockPriceCents: number;
  className?: string;
  size?: "sm" | "md";
};

const sizeClass = {
  sm: { main: "text-base", sub: "text-[0.65rem]" },
  md: { main: "text-3xl", sub: "text-xs" },
};

export function ProductPrice({ blockPriceCents, className, size = "sm" }: Props) {
  const s = sizeClass[size];
  return (
    <span className={cn("flex flex-col items-end gap-0.5 tabular-nums", className)}>
      <span className={cn("font-medium text-price leading-tight", s.main)}>
        {formatPerVialPrice(blockPriceCents)}
      </span>
      <span className={cn("text-muted-foreground", s.sub)}>{formatBlockPrice(blockPriceCents)}</span>
    </span>
  );
}
