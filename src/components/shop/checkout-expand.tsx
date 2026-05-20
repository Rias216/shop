"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
};

export function CheckoutExpand({
  label,
  description,
  checked,
  onCheckedChange,
  children,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--outline-strong)] bg-[var(--glass-bg-subtle)]",
        className,
      )}
    >
      <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5">
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          className="mt-0.5"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-foreground">{label}</span>
          {description && (
            <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
          )}
        </span>
      </label>
      {checked && (
        <div className="space-y-2 border-t border-[var(--outline)] px-3 pb-3 pt-2">{children}</div>
      )}
    </div>
  );
}
