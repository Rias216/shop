import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  stock: number;
  isActive: boolean;
  groupKey: string | null;
  variantLabel: string | null;
  coaCount: number;
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group } = await searchParams;
  const products = await db.product.findMany({
    orderBy: [{ groupKey: "asc" }, { updatedAt: "desc" }],
    include: { _count: { select: { coaDocuments: true } } },
  });

  const rows: Row[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    priceCents: p.priceCents,
    stock: p.stock,
    isActive: p.isActive,
    groupKey: p.groupKey,
    variantLabel: p.variantLabel,
    coaCount: p._count.coaDocuments,
  }));

  // Group by groupKey; null groupKey → standalone
  const groups = new Map<string | null, Row[]>();
  for (const r of rows) {
    const key = r.groupKey;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }

  const orderedKeys = [...groups.keys()].sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return a.localeCompare(b);
  });

  return (
    <article>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/products/new-group">Add group (multi-dosage)</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">Add single product</Link>
          </Button>
        </div>
      </header>

      {group && (
        <p className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-800 dark:text-green-200">
          Group <span className="font-mono">{group}</span> created.
        </p>
      )}

      <div className="mt-8 space-y-6">
        {orderedKeys.map((key) => {
          const items = groups.get(key)!;
          if (key === null) {
            return (
              <section
                key="__standalone"
                className="glass-strong overflow-hidden rounded-2xl"
              >
                <header className="border-b border-[var(--outline)] px-4 py-3">
                  <h2 className="text-sm font-semibold">Standalone products</h2>
                </header>
                <ProductTable rows={items} />
              </section>
            );
          }
          return (
            <section key={key} className="glass-strong overflow-hidden rounded-2xl">
              <header className="border-b border-[var(--outline)] px-4 py-3">
                <h2 className="text-sm font-semibold">
                  Group <span className="font-mono">{key}</span>{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({items.length} variant{items.length === 1 ? "" : "s"})
                  </span>
                </h2>
              </header>
              <ProductTable rows={items} />
            </section>
          );
        })}
      </div>
    </article>
  );
}

function ProductTable({ rows }: { rows: Row[] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-[var(--outline)] text-xs uppercase tracking-wide text-muted-foreground">
          <th className="px-4 py-2 font-semibold">Name</th>
          <th className="font-semibold">SKU</th>
          <th className="font-semibold">Price</th>
          <th className="font-semibold">Stock</th>
          <th className="font-semibold">COAs</th>
          <th className="font-semibold">Active</th>
          <th />
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--outline)]">
        {rows.map((p) => (
          <tr key={p.id} className="hover:bg-[var(--nav-hover)]">
            <td className="px-4 py-2.5 font-medium">
              {p.name}
              {p.variantLabel && (
                <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[0.65rem] font-medium text-accent">
                  {p.variantLabel}
                </span>
              )}
            </td>
            <td className="font-mono text-xs">{p.sku}</td>
            <td className="tabular-nums">{formatPrice(p.priceCents)}</td>
            <td className="tabular-nums">{p.stock}</td>
            <td>{p.coaCount}</td>
            <td>{p.isActive ? "Yes" : "No"}</td>
            <td className="pr-4">
              <Link href={`/admin/products/${p.id}`} className="text-accent hover:underline">
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
