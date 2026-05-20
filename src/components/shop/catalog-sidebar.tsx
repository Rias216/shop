import { Suspense } from "react";
import { Input } from "@/components/ui/input";
import { CatalogFilterLink } from "@/components/shop/catalog-filter-link";
import {
  CatalogSearchInput,
  CatalogSearchStatus,
} from "@/components/shop/catalog-search-input";
import { catalogHref, parseCatalogSort } from "@/lib/catalog";
import { CATALOG_FILTERS, parseCatalogFilterSlug } from "@/lib/product-categories";
import { ORDER_QTY_CATALOG_NOTE } from "@/lib/order-qty";
import { cn } from "@/lib/utils";

type Props = {
  category?: string;
  q?: string;
  sort?: string;
  resultCount: number;
};

const filterLink =
  "pressable flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium transition-[color,background-color,box-shadow,transform] duration-[var(--duration-normal)] ease-[var(--ease-snappy)]";
const filterActive = "bg-accent/15 text-foreground ring-1 ring-accent/30";
const filterIdle =
  "text-muted-foreground hover:bg-[var(--nav-hover)] hover:text-foreground";

export function CatalogSidebar({ category, q, sort, resultCount }: Props) {
  const activeSlug = parseCatalogFilterSlug(category);
  const searchValue = q?.trim() ?? "";
  const sortSlug = parseCatalogSort(sort);
  const sortParam = sortSlug === "new" ? undefined : sortSlug;

  return (
    <aside className="catalog-sidebar glass-strong flex flex-col gap-6 p-5 max-lg:static lg:sticky lg:top-24 lg:z-20 lg:self-start">
      <div className="space-y-3">
        <Suspense
          fallback={
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Search
              </span>
              <Input
                disabled
                placeholder="Name, SKU, CAS…"
                className="catalog-search-input mt-1.5 opacity-60"
              />
            </div>
          }
        >
          <CatalogSearchInput category={category} />
        </Suspense>
        {(searchValue || activeSlug) && (
          <CatalogFilterLink
            href="/catalog"
            className="flex min-h-10 items-center justify-center text-center text-xs font-medium text-muted-foreground transition-colors duration-[var(--duration-normal)] hover:text-accent"
          >
            Clear filters
          </CatalogFilterLink>
        )}
      </div>

      <nav aria-label="Category filters" className="space-y-1 border-t border-[var(--divider)] pt-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Filter
        </h2>
        <ul className="space-y-0.5">
          {CATALOG_FILTERS.map((item) => {
            const isActive = item.slug === undefined ? !activeSlug : activeSlug === item.slug;
            return (
              <li key={item.label}>
                <CatalogFilterLink
                  href={catalogHref({
                    category: item.slug,
                    q: searchValue || undefined,
                    sort: sortParam,
                  })}
                  className={cn(filterLink, isActive ? filterActive : filterIdle)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </CatalogFilterLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <CatalogSearchStatus resultCount={resultCount} q={q} />

      <p className="text-[0.7rem] leading-relaxed text-muted-foreground/90">
        {ORDER_QTY_CATALOG_NOTE}
      </p>
    </aside>
  );
}
