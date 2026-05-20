"use client";

import { useSearchParams } from "next/navigation";
import { CatalogFilterLink } from "@/components/shop/catalog-filter-link";
import { CATALOG_SORT_OPTIONS, parseCatalogSort } from "@/lib/catalog";
import { catalogHref } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Props = {
  category?: string;
  className?: string;
};

export function CatalogSortSelect({ category, className }: Props) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? undefined;
  const active = parseCatalogSort(searchParams.get("sort") ?? undefined);

  return (
    <div className={cn("catalog-sort flex flex-wrap items-center gap-2", className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Sort
      </span>
      <div className="flex flex-wrap gap-1">
        {CATALOG_SORT_OPTIONS.map((opt) => {
          const href = catalogHref({
            category,
            q,
            sort: opt.value === "new" ? undefined : opt.value,
          });
          const isActive = active === opt.value;
          return (
            <CatalogFilterLink
              key={opt.value}
              href={href}
              className={cn(
                "catalog-sort-chip pressable rounded-md px-2.5 py-1.5 text-xs font-medium",
                isActive
                  ? "bg-accent/15 text-foreground ring-1 ring-accent/30"
                  : "text-muted-foreground hover:bg-[var(--nav-hover)] hover:text-foreground",
              )}
              aria-current={isActive ? "true" : undefined}
            >
              {opt.label}
            </CatalogFilterLink>
          );
        })}
      </div>
    </div>
  );
}

