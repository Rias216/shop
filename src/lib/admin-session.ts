import { SignJWT, jwtVerify } from "jose";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 8;

export type AdminSession = {
  id: string;
  username: string;
};

export function adminSessionCookieSecure(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const siteUrl =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "";
  return siteUrl.startsWith("https://");
}

function sessionSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  if (!raw.trim()) {
    throw new Error("AUTH_SECRET is required for admin sessions.");
  }
  return new TextEncoder().encode(raw);
}

export async function signAdminSession(admin: AdminSession): Promise<string> {
  return new SignJWT({ username: admin.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE_SEC}s`)
    .sign(sessionSecret());
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    const id = payload.sub;
    const username = payload.username;
    if (typeof id !== "string" || typeof username !== "string") return null;
    return { id, username };
  } catch {
    return null;
  }
}
