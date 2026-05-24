import "server-only";

import { randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { cookieSecure } from "@/lib/cookie-secure";
import { CSRF_COOKIE } from "@/lib/csrf-constants";

export { CSRF_COOKIE, CSRF_FORM_FIELD } from "@/lib/csrf-constants";

export async function getOrCreateCsrfToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CSRF_COOKIE)?.value;
  if (existing) return existing;

  const token = randomBytes(32).toString("hex");
  store.set(CSRF_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return token;
}

export async function verifyCsrfFormToken(formToken: FormDataEntryValue | null): Promise<boolean> {
  if (typeof formToken !== "string" || !formToken) return false;
  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE)?.value;
  if (!cookieToken) return false;
  const a = Buffer.from(formToken);
  const b = Buffer.from(cookieToken);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
