export function CatalogGridSkeleton() {
  return (
    <div
      className="catalog-skeleton-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="catalog-skeleton-card glass overflow-hidden">
          <div className="catalog-skeleton-shimmer aspect-[4/5] min-h-[12rem] w-full" />
          <div className="flex flex-col gap-1.5 border-t border-[var(--divider)] p-2">
            <div className="catalog-skeleton-shimmer h-3.5 w-4/5 rounded-md" />
            <div className="flex justify-between gap-2">
              <div className="catalog-skeleton-shimmer h-3 w-1/3 rounded-md" />
              <div className="catalog-skeleton-shimmer h-4 w-1/4 rounded-md" />
            </div>
            <div className="catalog-skeleton-shimmer h-7 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
