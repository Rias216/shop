import { cookies } from "next/headers";

const COUPON_COOKIE = "research_coupon";

export async function getCouponCodeFromCookie(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COUPON_COOKIE)?.value?.trim().toUpperCase();
  return raw || null;
}

export async function setCouponCodeCookie(code: string | null): Promise<void> {
  const store = await cookies();
  if (!code) {
    store.delete(COUPON_COOKIE);
    return;
  }
  store.set(COUPON_COOKIE, code.trim().toUpperCase(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
