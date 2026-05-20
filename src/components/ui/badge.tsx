import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "border-accent/30 bg-accent/90 text-white dark:text-slate-900",
        secondary: "border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] text-muted-foreground",
        outline: "border-[var(--glass-border)] bg-transparent text-foreground",
        research:
          "border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
