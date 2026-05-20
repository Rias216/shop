import { PaperCupIcon } from "@/components/shop/paper-cup-icon";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Header only — Peptides .cafe with paper cup on the right. */
export function BrandMark({ className }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex items-baseline gap-0.5 leading-none">
        <span className="text-[1.15rem] font-semibold tracking-tight text-foreground md:text-[1.25rem]">
          Peptides
        </span>
        <span className="text-[0.7rem] text-muted-foreground">.cafe</span>
      </span>
      <PaperCupIcon />
    </span>
  );
}
