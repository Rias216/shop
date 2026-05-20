import { CatalogGridSkeleton } from "@/components/shop/catalog-grid-skeleton";
import { CatalogHero } from "@/components/shop/catalog-hero";

export default function CatalogLoading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-12">
      <CatalogHero />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside
          className="catalog-sidebar glass-strong h-48 w-full shrink-0 animate-pulse rounded-lg lg:sticky lg:top-24 lg:w-[15.5rem] lg:self-start"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <CatalogGridSkeleton />
        </div>
      </div>
    </section>
  );
}
