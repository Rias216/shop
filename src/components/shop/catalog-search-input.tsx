"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { catalogHref, parseCatalogSort } from "@/lib/catalog";
import { useCatalogPending } from "@/components/shop/catalog-pending-context";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";

type Props = {
  category?: string;
};

export function CatalogSearchInput({ category }: Props) {
  const searchParams = useSearchParams();
  const { navigate, prefetch, isPending } = useCatalogPending();
  const activeFilter = category;
  const urlQ = searchParams.get("q") ?? "";

  const [value, setValue] = useState(() => urlQ);
  const [isTyping, setIsTyping] = useState(false);

  const sort = parseCatalogSort(searchParams.get("sort") ?? undefined);

  const pushSearch = useDebouncedCallback((nextQ: string) => {
    const href = catalogHref({
      category: activeFilter,
      q: nextQ || undefined,
      sort: sort === "new" ? undefined : sort,
    });
    prefetch(href);
    navigate(href);
  }, 280);

  const handleChange = (next: string) => {
    setValue(next);
    setIsTyping(true);
    pushSearch(next);
  };

  const handleClear = () => {
    setValue("");
    setIsTyping(true);
    const href = catalogHref({
      category: activeFilter,
      sort: sort === "new" ? undefined : sort,
    });
    prefetch(href);
    navigate(href);
  };

  const searchActive = isPending || isTyping;
  const displayValue = isTyping ? value : urlQ;

  return (
    <div className={cn("catalog-search-wrap", searchActive && "catalog-search-wrap--active")}>
      <label
        htmlFor="catalog-search"
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Search
      </label>
      <div className="relative mt-1.5">
        <Input
          id="catalog-search"
          type="search"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Name, SKU, CAS…"
          className={cn(
            "catalog-search-input pr-9",
            searchActive && "catalog-search-input--active",
          )}
          autoComplete="off"
          spellCheck={false}
        />
        {searchActive && (
          <span className="catalog-search-indicator" aria-hidden>
            <span className="catalog-search-dot" />
            <span className="catalog-search-dot" />
            <span className="catalog-search-dot" />
          </span>
        )}
        {displayValue.length > 0 && !searchActive && (
          <button
            type="button"
            onClick={handleClear}
            className="pressable-float absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-[var(--nav-hover)] hover:text-foreground"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export function CatalogSearchStatus({
  resultCount,
  q,
  className,
}: {
  resultCount: number;
  q?: string;
  className?: string;
}) {
  const { isPending } = useCatalogPending();
  const searchValue = q?.trim() ?? "";

  return (
    <p
      className={cn(
        "catalog-search-status border-t border-[var(--divider)] pt-4 text-xs text-muted-foreground",
        className,
      )}
    >
      <span key={isPending ? "pending" : `done-${resultCount}-${searchValue}`} className="catalog-search-status-text">
        {isPending ? "Searching…" : (
          <>
            {resultCount} {resultCount === 1 ? "product" : "products"}
            {searchValue ? ` matching “${searchValue}”` : ""}
          </>
        )}
      </span>
    </p>
  );
}
