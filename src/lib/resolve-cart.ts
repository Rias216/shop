import { db } from "./db";
import type { ProductCategory } from "@/generated/prisma/client";
import type { CartItem } from "./cart";
import { lineTotalCents as cartLineTotal } from "./pricing";
import { ORDER_QTY_STEP, formatOrderQty, isValidOrderQty, maxOrderQty } from "./order-qty";

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
      })
    : [];
  const productById = new Map(products.map((product) => [product.id, product]));

  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product) {
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
