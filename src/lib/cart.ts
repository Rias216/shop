import { cookies } from "next/headers";

export type CartItem = {
  productId: string;
  qty: number;
};

const CART_COOKIE = "research_cart";

export async function getCart(): Promise<CartItem[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) => typeof i.productId === "string" && typeof i.qty === "number" && i.qty > 0,
    );
  } catch {
    return [];
  }
}

export async function setCart(items: CartItem[]): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, JSON.stringify(items), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function addToCart(productId: string, qty = 1): Promise<CartItem[]> {
  const cart = await getCart();
  const existing = cart.find((i) => i.productId === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ productId, qty });
  }
  await setCart(cart);
  return cart;
}

export async function updateCartItem(
  productId: string,
  qty: number,
): Promise<CartItem[]> {
  let cart = await getCart();
  if (qty <= 0) {
    cart = cart.filter((i) => i.productId !== productId);
  } else {
    cart = cart.map((i) => (i.productId === productId ? { ...i, qty } : i));
  }
  await setCart(cart);
  return cart;
}

export async function clearCart(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}

/** Drop cart lines whose product no longer exists in the database. */
export async function pruneOrphanCartItems(): Promise<CartItem[]> {
  const { db } = await import("@/lib/db");
  const items = await getCart();
  if (items.length === 0) return items;

  const uniqueIds = [...new Set(items.map((item) => item.productId))];
  const existing = await db.product.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((row) => row.id));
  const kept = items.filter((item) => existingIds.has(item.productId));

  if (kept.length !== items.length) {
    await setCart(kept);
  }
  return kept;
}
