import { GroupedProductCard } from "@/components/shop/grouped-product-card";
import { aggregateRatingForGroup, type ProductGroup } from "@/lib/product-groups";
import type { ProductRatingSummary } from "@/lib/reviews";

type Props = {
  groups: ProductGroup[];
  ratingSummaries: Map<string, ProductRatingSummary>;
  columns?: "catalog" | "home";
};

export function ProductGridSection({ groups, ratingSummaries, columns = "catalog" }: Props) {
  const gridClass =
    columns === "home"
      ? "product-grid product-grid--home grid gap-5 grid-cols-2 lg:grid-cols-4"
      : "product-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={gridClass}>
      {groups.map((group) => (
        <GroupedProductCard
          key={group.key}
          group={group}
          ratingSummary={aggregateRatingForGroup(group, ratingSummaries)}
        />
      ))}
    </div>
  );
}
