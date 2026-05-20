import Link from "next/link";
import { ProductWizard } from "@/components/admin/product-wizard";
import { getStoreSettings } from "@/lib/settings";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const settings = await getStoreSettings();

  return (
    <article className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Add product</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Step through identity, pricing, details, and legal.
          </p>
        </div>
        <Link
          href="/admin/products/new-group"
          className="text-sm font-medium text-accent hover:underline"
        >
          Need multiple dosages? Use bulk creator →
        </Link>
      </div>
      <ProductWizard error={error} defaultLegalNotice={settings.defaultLegalNotice} />
    </article>
  );
}
