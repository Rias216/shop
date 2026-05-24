import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session-server";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login?error=session");
  }
  return session;
}

export function adminReviewsRedirect(returnTo: string | null | undefined): string {
  const path = returnTo?.trim();
  if (!path || !path.startsWith("/admin/reviews")) {
    return "/admin/reviews";
  }
  return path;
}
