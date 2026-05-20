import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
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
