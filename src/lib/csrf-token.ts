import { CSRF_COOKIE } from "@/lib/csrf-constants";
import { cookieSecure } from "@/lib/cookie-secure";

export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function csrfCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure(),
    path: "/",
    maxAge: 60 * 60 * 24,
  };
}

export { CSRF_COOKIE };
