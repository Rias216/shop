import Link from "next/link";
import { ProductGroupForm } from "@/components/admin/product-group-form";
import { getStoreSettings } from "@/lib/settings";

export default async function NewProductGroupPage({
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
          <h1 className="text-2xl font-bold">Add product group</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One base compound with several dosages, created in a single submit.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="text-sm font-medium text-accent hover:underline"
        >
          ← Single product instead
        </Link>
      </div>
      <ProductGroupForm error={error} defaultLegalNotice={settings.defaultLegalNotice} />
    </article>
  );
}
