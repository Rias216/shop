import { Syringe } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Header brand — Just Peps with syringe mark. */
export function BrandMark({ className }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="text-[1.15rem] font-semibold tracking-tight text-foreground md:text-[1.25rem]">
        Just Peps
      </span>
      <Syringe
        className="h-5 w-5 shrink-0 text-accent"
        strokeWidth={2}
        aria-hidden
      />
    </span>
  );
}
