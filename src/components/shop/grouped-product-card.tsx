import { ProductCard } from "@/components/shop/product-card";
import { GroupedProductCardMulti, type MultiGroupPreview } from "@/components/shop/grouped-product-card-multi";
import { getLatestCoa } from "@/lib/coa";
import type { ProductGroup } from "@/lib/product-groups";
import type { ProductRatingSummary } from "@/lib/reviews";

type Props = {
  group: ProductGroup;
  ratingSummary: ProductRatingSummary;
  className?: string;
};

function toMultiGroupPreview(group: ProductGroup): MultiGroupPreview {
  return {
    key: group.key,
    displayName: group.displayName,
    category: group.category,
    graphicSlug: group.defaultVariant.slug,
    graphicSku: group.defaultVariant.sku,
    defaultVariantId: group.defaultVariant.id,
    variants: group.variants.map((v) => ({
      id: v.id,
      slug: v.slug,
      name: v.name,
      variantLabel: v.variantLabel,
      priceCents: v.priceCents,
      stock: v.stock,
      purity: v.purity,
      sku: v.sku,
      latestCoaUrl: getLatestCoa(v.coaDocuments)?.fileUrl,
    })),
  };
}

export function GroupedProductCard({ group, ratingSummary, className }: Props) {
  if (!group.hasMultipleVariants) {
    const product = group.defaultVariant;
    return (
      <div className={className}>
        <ProductCard
          product={product}
          latestCoaUrl={getLatestCoa(product.coaDocuments)?.fileUrl}
          ratingSummary={ratingSummary}
        />
      </div>
    );
  }

  return (
    <GroupedProductCardMulti
      group={toMultiGroupPreview(group)}
      ratingSummary={ratingSummary}
      className={className}
    />
  );
}
