import { Suspense } from "react";
import { CatalogGridSkeleton } from "@/components/shop/catalog-grid-skeleton";
import { CatalogHero } from "@/components/shop/catalog-hero";
import { CatalogMain } from "@/components/shop/catalog-main";
import { CatalogPendingProvider } from "@/components/shop/catalog-pending-context";
import { CatalogProductGrid } from "@/components/shop/catalog-product-grid";
import { CatalogSidebar } from "@/components/shop/catalog-sidebar";
import { CatalogSortSelect } from "@/components/shop/catalog-sort-select";
import { getCatalogProductCount } from "@/lib/catalog-products";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const resultCount = await getCatalogProductCount(params);
  const suspenseKey = `${params.category ?? ""}|${params.q?.trim() ?? ""}|${params.sort ?? "new"}`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-12">
      <CatalogHero />

      <CatalogPendingProvider>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <CatalogSidebar
            category={params.category}
            q={params.q}
            sort={params.sort}
            resultCount={resultCount}
          />

          <CatalogMain>
            <Suspense fallback={null}>
              <CatalogSortSelect category={params.category} className="mb-5" />
            </Suspense>
            <Suspense key={suspenseKey} fallback={<CatalogGridSkeleton />}>
              <CatalogProductGrid params={params} />
            </Suspense>
          </CatalogMain>
        </div>
      </CatalogPendingProvider>
    </section>
  );
}
