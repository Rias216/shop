"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { addToCart, pruneOrphanCartItems, updateCartItem, clearCart } from "./cart";
import { verifyCsrfFormToken } from "./csrf";
import { CSRF_FORM_FIELD } from "./csrf-constants";
import { isValidOrderQty, normalizeOrderQty } from "./order-qty";

async function assertCsrf(formData: FormData): Promise<void> {
  if (!(await verifyCsrfFormToken(formData.get(CSRF_FORM_FIELD)))) {
    throw new Error("Invalid CSRF token.");
  }
}

export async function addToCartAction(formData: FormData) {
  await assertCsrf(formData);
  const productId = formData.get("productId") as string;
  const qty = Number(formData.get("qty") ?? 10);
  if (!productId) return;
  const product = await db.product.findFirst({
    where: { id: productId, isActive: true },
    select: { stock: true },
  });
  if (!product || product.stock < 1) return;
  const safeQty = normalizeOrderQty(qty, product.stock);
  if (!isValidOrderQty(safeQty, product.stock)) return;
  await addToCart(productId, safeQty);
  await pruneOrphanCartItems();
  revalidatePath("/cart");
  revalidatePath("/");
}

export async function updateCartAction(formData: FormData) {
  await assertCsrf(formData);
  const productId = formData.get("productId") as string;
  const qty = Number(formData.get("qty") ?? 0);
  if (!productId) return;
  if (qty === 0) {
    await updateCartItem(productId, 0);
    revalidatePath("/cart");
    return;
  }
  const product = await db.product.findFirst({
    where: { id: productId, isActive: true },
    select: { stock: true },
  });
  if (!product) return;
  const safeQty = normalizeOrderQty(qty, product.stock);
  if (!isValidOrderQty(safeQty, product.stock)) return;
  await updateCartItem(productId, safeQty);
  revalidatePath("/cart");
}

export async function clearCartAction(formData: FormData) {
  await assertCsrf(formData);
  await clearCart();
  revalidatePath("/cart");
}
