import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Header brand lockup — wordmark with trailing emoji mark. */
export function BrandMark({ className }: Props) {
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className="brand-glow flex items-baseline gap-1 text-[1.0625rem] font-semibold tracking-tight md:text-[1.125rem]">
        <span className="text-foreground">Just</span>
        <span className="inline-flex items-center gap-0.5">
          <span className="text-accent">Peps</span>
          <span
            className="relative -top-px text-[0.7rem] leading-none select-none md:text-[0.75rem]"
            aria-hidden
          >
            💉
          </span>
        </span>
      </span>
      <span className="mt-1 text-[0.5625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Research supply
      </span>
    </span>
  );
}
