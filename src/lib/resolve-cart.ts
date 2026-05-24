import { cache } from "react";
import { db } from "./db";
import type { ProductCategory } from "@/generated/prisma/client";
import type { CartItem } from "./cart";
import { getCart } from "./cart";
import { lineTotalCents as cartLineTotal } from "./pricing";
import { ORDER_QTY_STEP, formatOrderQty, isValidOrderQty, maxOrderQty } from "./order-qty";
import { createPagePerf } from "@/lib/perf";

export type ResolvedCartLine = {
  productId: string;
  qty: number;
  name: string;
  slug: string;
  sku: string;
  category: ProductCategory;
  priceCents: number;
  stock: number;
  lineTotalCents: number;
};

const cartProductSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  category: true,
  priceCents: true,
  stock: true,
  isActive: true,
} as const;

export async function resolveCart(items: CartItem[]): Promise<{
  lines: ResolvedCartLine[];
  totalCents: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const lines: ResolvedCartLine[] = [];
  let totalCents = 0;

  const uniqueIds = [...new Set(items.map((item) => item.productId))];
  const products = uniqueIds.length
    ? await db.product.findMany({
        where: { id: { in: uniqueIds } },
        select: cartProductSelect,
      })
    : [];
  const productById = new Map(products.map((product) => [product.id, product]));

  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product || !product.isActive) {
      errors.push(
        `An item in your cart is no longer available. Remove it and try again.`,
      );
      continue;
    }
    if (!isValidOrderQty(item.qty, product.stock)) {
      errors.push(
        `${product.name}: use ${formatOrderQty(ORDER_QTY_STEP)} or more, in +${ORDER_QTY_STEP} vial steps (max ${formatOrderQty(maxOrderQty(product.stock))})`,
      );
      continue;
    }
    if (product.stock < item.qty) {
      errors.push(`Insufficient vial stock for ${product.name}`);
      continue;
    }
    const lineTotalCents = cartLineTotal(product.priceCents, item.qty);
    lines.push({
      productId: product.id,
      qty: item.qty,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      category: product.category,
      priceCents: product.priceCents,
      stock: product.stock,
      lineTotalCents,
    });
    totalCents += lineTotalCents;
  }

  return { lines, totalCents, errors };
}

/** Single cookie read + one product query; deduped per request via React cache(). */
export const resolveCartFromCookie = cache(async function resolveCartFromCookie() {
  const perf = createPagePerf("cart.resolve");
  const items = await perf.time("cookie", () => getCart());
  if (items.length === 0) {
    perf.flush({ items: 0 });
    return { items: [] as CartItem[], lines: [], totalCents: 0, errors: [] as string[] };
  }

  const uniqueIds = [...new Set(items.map((item) => item.productId))];
  const products = await perf.time("db.products", () =>
    db.product.findMany({
      where: { id: { in: uniqueIds } },
      select: cartProductSelect,
    }),
  );
  const existingIds = new Set(products.map((p) => p.id));
  const sanitized = items.filter((item) => existingIds.has(item.productId));

  const resolved = await perf.time("resolve", () => resolveCart(sanitized));
  perf.flush({ items: sanitized.length, lines: resolved.lines.length });
  return { items: sanitized, ...resolved };
});
