import { notFound } from "next/navigation";
import { ProductWizard } from "@/components/admin/product-wizard";
import { uploadCoaAction } from "@/lib/admin-actions";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; coa?: string }>;
}) {
  const { id } = await params;
  const { error, saved, coa } = await searchParams;
  const product = await db.product.findUnique({
    where: { id },
    include: { coaDocuments: { orderBy: { issuedAt: "desc" } } },
  });
  if (!product) notFound();
  const settings = await getStoreSettings();

  return (
    <article className="space-y-12">
      <section>
        <h1 className="text-2xl font-bold">Edit product</h1>
        {coa === "1" && (
          <p className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-800 dark:text-green-200">
            COA uploaded.
          </p>
        )}
        <div className="mt-8">
          <ProductWizard
            product={product}
            error={error}
            saved={saved === "1"}
            defaultLegalNotice={settings.defaultLegalNotice}
          />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold">COA documents</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {product.coaDocuments.map((coa) => (
            <li key={coa.id}>
              <a href={coa.fileUrl} className="underline" target="_blank" rel="noreferrer">
                {coa.batchCode}
              </a>
              {coa.labName && ` — ${coa.labName}`}
            </li>
          ))}
        </ul>
        <form action={uploadCoaAction} className="mt-6 max-w-md space-y-4">
          <input type="hidden" name="productId" value={product.id} />
          <p>
            <Label htmlFor="batchCode">Batch code</Label>
            <Input id="batchCode" name="batchCode" required className="mt-1" />
          </p>
          <p>
            <Label htmlFor="labName">Lab name</Label>
            <Input id="labName" name="labName" className="mt-1" />
          </p>
          <p>
            <Label htmlFor="file">COA PDF</Label>
            <Input id="file" name="file" type="file" accept="application/pdf" required className="mt-1" />
          </p>
          <Button type="submit">Upload COA</Button>
        </form>
      </section>
    </article>
  );
}
