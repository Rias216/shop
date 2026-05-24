import Link from "next/link";
import { adminLogoutAction } from "@/lib/admin-login-actions";
import { getAdminSession } from "@/lib/admin-session-server";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
const navLink =
  "pressable rounded-md px-3 py-1.5 text-muted-foreground hover:bg-[var(--nav-hover)] hover:text-foreground";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  const isLogin = !session;

  return (
    <div className="relative min-h-screen">
      {!isLogin && (
        <header className="glass-nav sticky top-0 z-50">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 text-sm">
            <Link
              href="/admin"
              className="font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-md"
            >
              Admin
            </Link>
            <span className="flex flex-wrap items-center gap-1">
              <Link href="/admin/products" className={navLink}>
                Products
              </Link>
              <Link href="/admin/orders" className={navLink}>
                Orders
              </Link>
              <Link href="/admin/reviews" className={navLink}>
                Reviews
              </Link>
              <Link href="/admin/coupons" className={navLink}>
                Coupons
              </Link>
              <Link href="/admin/settings" className={navLink}>
                Settings
              </Link>
              <Link href="/" className={navLink}>
                Storefront
              </Link>
              <ThemeToggle />
              <form action={adminLogoutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </span>
          </nav>
        </header>
      )}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
