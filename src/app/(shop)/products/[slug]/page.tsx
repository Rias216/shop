import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGraphic } from "@/components/shop/product-graphic";
import { ProductReviews } from "@/components/shop/product-reviews";
import { ProductVariantPicker } from "@/components/shop/product-variant-picker";
import { db } from "@/lib/db";
import { getProductVariantsByGroupKey } from "@/lib/catalog-products";
import {
  aggregateRatingForGroup,
  displayNameFromProduct,
  groupCatalogProducts,
} from "@/lib/product-groups";
import { createPagePerf } from "@/lib/perf";
import { productDetailSelect } from "@/lib/product-include";
import { getStoreSettings } from "@/lib/settings";
import { getApprovedReviews, getProductRatingSummaries } from "@/lib/reviews";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const perf = createPagePerf("product");
  const { slug } = await params;
  const [settings, product] = await Promise.all([
    getStoreSettings(),
    db.product.findFirst({
      where: { slug, isActive: true },
      select: productDetailSelect,
    }),
  ]);
  if (!product) notFound();

  const variantsPromise = product.groupKey
    ? getProductVariantsByGroupKey(product.groupKey)
    : Promise.resolve([
        {
          ...product,
          coaDocuments: product.coaDocuments,
        },
      ]);

  const [variants, approvedReviews] = await Promise.all([
    perf.time("db.variants", () => variantsPromise),
    perf.time("db.reviews", () => getApprovedReviews(product.id)),
  ]);

  const group = groupCatalogProducts(variants)[0]!;
  const ratingSummaries = await perf.time("db.ratings", () =>
    getProductRatingSummaries(variants.map((v) => v.id)),
  );
  const ratingSummary = aggregateRatingForGroup(group, ratingSummaries);

  const graphicName = displayNameFromProduct(product);
  perf.flush({ variants: variants.length, reviews: approvedReviews.length });

  return (
    <article className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGraphic
          slug={product.slug}
          name={graphicName}
          sku={product.sku}
          category={product.category}
          size="lg"
          className="glass-strong w-full overflow-hidden"
        />
        <ProductVariantPicker
          variants={variants}
          initialProductId={product.id}
          ratingSummary={ratingSummary}
          defaultLegalNotice={settings.defaultLegalNotice}
        />
      </div>

      <ProductReviews
        productId={product.id}
        summary={ratingSummary}
        reviews={approvedReviews}
      />

      <Link
        href="/catalog"
        className="mt-8 inline-block text-sm text-muted-foreground transition hover:text-accent"
      >
        ← Back to shop
      </Link>
    </article>
  );
}
