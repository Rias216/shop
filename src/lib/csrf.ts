import "server-only";

import { timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { CSRF_COOKIE, CSRF_REQUEST_HEADER } from "@/lib/csrf-constants";

export { CSRF_COOKIE, CSRF_FORM_FIELD } from "@/lib/csrf-constants";

/** Read-only — cookie is created in proxy.ts, not in layouts. */
export async function getCsrfToken(): Promise<string> {
  const store = await cookies();
  const fromCookie = store.get(CSRF_COOKIE)?.value;
  if (fromCookie) return fromCookie;

  const h = await headers();
  return h.get(CSRF_REQUEST_HEADER) ?? "";
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
