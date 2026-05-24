"use server";

import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearAdminSession, setAdminSession } from "@/lib/admin-session-server";
import { enforceSecurityEnv } from "@/lib/security-env";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";

function safeCallbackUrl(raw: string | null): string {
  const value = (raw ?? "/admin").trim();
  if (!value.startsWith("/admin") || value.startsWith("//")) return "/admin";
  return value;
}

export async function adminLoginAction(formData: FormData) {
  enforceSecurityEnv();
  const login = String(formData.get("login") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = safeCallbackUrl(String(formData.get("callbackUrl") ?? ""));

  if (!login || !password) {
    redirect(`/admin/login?error=invalid&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const headerList = await headers();
  const limiter = rateLimit({
    key: `admin-login:${clientIpFromHeaders(headerList)}`,
    limit: 15,
    windowMs: 60_000,
  });
  if (!limiter.ok) {
    redirect(`/admin/login?error=rate&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const admin = await db.adminUser.findUnique({ where: { email: login } });
  if (!admin || !(await compare(password, admin.passwordHash))) {
    redirect(`/admin/login?error=invalid&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  await setAdminSession({ id: admin.id, email: admin.email });
  redirect(callbackUrl);
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
