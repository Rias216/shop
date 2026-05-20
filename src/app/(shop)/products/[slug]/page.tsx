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
import { getStoreSettings } from "@/lib/settings";
import { getApprovedReviews, getProductRatingSummaries } from "@/lib/reviews";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [settings, product] = await Promise.all([
    getStoreSettings(),
    db.product.findFirst({
      where: { slug, isActive: true },
      include: { coaDocuments: { orderBy: { issuedAt: "desc" } } },
    }),
  ]);
  if (!product) notFound();

  const variants = product.groupKey
    ? await getProductVariantsByGroupKey(product.groupKey)
    : [
        {
          ...product,
          coaDocuments: product.coaDocuments,
        },
      ];

  const group = groupCatalogProducts(variants)[0]!;
  const [ratingSummaries, approvedReviews] = await Promise.all([
    getProductRatingSummaries(variants.map((v) => v.id)),
    getApprovedReviews(product.id),
  ]);
  const ratingSummary = aggregateRatingForGroup(group, ratingSummaries);

  const graphicName = displayNameFromProduct(product);

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
