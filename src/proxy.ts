import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin-session";
import { CSRF_REQUEST_HEADER } from "@/lib/csrf-constants";
import { CSRF_COOKIE, csrfCookieOptions, generateCsrfToken } from "@/lib/csrf-token";

function attachCsrf(req: NextRequest, response: NextResponse): NextResponse {
  const existing = req.cookies.get(CSRF_COOKIE)?.value;
  const token = existing ?? generateCsrfToken();

  if (!existing) {
    response.cookies.set(CSRF_COOKIE, token, csrfCookieOptions());
  }

  return response;
}

function nextWithCsrf(req: NextRequest): NextResponse {
  const existing = req.cookies.get(CSRF_COOKIE)?.value;
  const token = existing ?? generateCsrfToken();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(CSRF_REQUEST_HEADER, token);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return attachCsrf(req, response);
}

export async function proxy(req: NextRequest) {
  const isAdminRoute =
    req.nextUrl.pathname.startsWith("/admin") &&
    !req.nextUrl.pathname.startsWith("/admin/login");

  if (!isAdminRoute) {
    return nextWithCsrf(req);
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifyAdminSessionToken(token) : null;

  if (!session) {
    const login = new URL("/admin/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return attachCsrf(req, NextResponse.redirect(login));
  }

  return nextWithCsrf(req);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|.*\\..*).*)",
  ],
};
