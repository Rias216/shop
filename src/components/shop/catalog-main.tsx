"use client";

import { useCatalogPending } from "@/components/shop/catalog-pending-context";
import { cn } from "@/lib/utils";

export function CatalogMain({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isPending } = useCatalogPending();

  return (
    <div
      className={cn("catalog-main min-w-0 flex-1", isPending && "catalog-main--pending", className)}
    >
      {children}
    </div>
  );
}
