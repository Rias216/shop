import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** e.g. "Mar 2026" */
  issuedLabel?: string;
};

export function CoaBadge({ className, issuedLabel }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400",
        className,
      )}
      title={issuedLabel ? `Latest COA · ${issuedLabel}` : "Certificate of Analysis on file"}
    >
      <span aria-hidden>✓</span>
      COA{issuedLabel ? ` · ${issuedLabel}` : ""}
    </span>
  );
}
