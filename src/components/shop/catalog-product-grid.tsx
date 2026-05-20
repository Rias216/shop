import { ProductGridAnimated } from "@/components/shop/product-grid-animated";
import { ProductGridSection } from "@/components/shop/product-grid-section";
import type { CatalogSearchParams } from "@/lib/catalog";
import { getCatalogProductGroupsCachedByParams } from "@/lib/catalog-products";

type Props = {
  params: CatalogSearchParams;
};

function gridAnimKey(params: CatalogSearchParams) {
  return `${params.category ?? ""}|${params.q?.trim() ?? ""}|${params.sort ?? "new"}`;
}

export async function CatalogProductGrid({ params }: Props) {
  const { groups, ratingByProductId: ratingSummaries } =
    await getCatalogProductGroupsCachedByParams(params);
  const hasFilters = Boolean(params.category || params.q?.trim());
  const animKey = gridAnimKey(params);

  if (groups.length === 0) {
    return (
      <ProductGridAnimated animKey={animKey}>
        <p className="catalog-empty glass-strong py-16 text-center text-muted-foreground">
          {hasFilters
            ? "No products match your search. Try another term or clear filters."
            : "No products in this category yet. Check back soon."}
        </p>
      </ProductGridAnimated>
    );
  }

  return (
    <ProductGridAnimated animKey={animKey}>
      <ProductGridSection groups={groups} ratingSummaries={ratingSummaries} columns="catalog" />
    </ProductGridAnimated>
  );
}
