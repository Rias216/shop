/** Secure cookies when the app is served over HTTPS in production. */
export function cookieSecure(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const siteUrl =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "";
  return siteUrl.startsWith("https://");
}
