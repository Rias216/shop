import { cn } from "@/lib/utils";

type Props = {
  label: string;
  fileUrl: string;
  className?: string;
};

export function CoaPurityButton({ label, fileUrl, className }: Props) {
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Open latest certificate of analysis"
      className={cn(
        "w-fit cursor-pointer text-sm text-muted-foreground transition-colors duration-[var(--duration-fast)]",
        "hover:text-foreground hover:underline active:opacity-70",
        "focus-visible:outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-accent/40",
        className,
      )}
    >
      {label}
    </a>
  );
}
