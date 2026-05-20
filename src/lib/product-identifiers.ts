import type { PrismaClient, ProductCategory } from "@/generated/prisma/client";
import { getCategorySkuPrefix } from "@/lib/product-categories";
import { slugify } from "@/lib/utils";

/** ASCII-safe slug; strips accents and symbols automatically */
export function slugFromName(name: string): string {
  const ascii = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ");
  return slugify(ascii) || "product";
}

/** SKU from product name + category prefix */
export function skuBaseFromName(name: string, category: ProductCategory): string {
  const prefix = getCategorySkuPrefix(category);
  const code = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase()
    .slice(0, 14);
  return `${prefix}-${code || "ITEM"}`;
}

export async function ensureUniqueSku(
  db: PrismaClient,
  base: string,
  excludeProductId?: string,
): Promise<string> {
  const normalized = base.trim().toUpperCase().replace(/\s+/g, "-");
  let candidate = normalized;
  let suffix = 2;

  for (;;) {
    const existing = await db.product.findFirst({
      where: {
        sku: candidate,
        ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }
}

export async function ensureUniqueSlug(
  db: PrismaClient,
  base: string,
  excludeProductId?: string,
): Promise<string> {
  const normalized = slugFromName(base);
  let candidate = normalized;
  let suffix = 2;

  for (;;) {
    const existing = await db.product.findFirst({
      where: {
        slug: candidate,
        ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }
}

export function normalizePurityInput(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value || value === "__none__") return null;
  return value;
}
