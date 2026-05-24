import Link from "next/link";
import { BrandMark } from "@/components/shop/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCart } from "@/lib/cart";
import { catalogHref } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const navLink =
  "pressable flex min-h-10 items-center rounded-md px-3 py-1.5 text-muted-foreground hover:bg-[var(--nav-hover)] hover:text-foreground";

export async function ShopHeader() {
  const cart = await getCart();
  const count = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
        <Link
          href="/"
          prefetch
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <BrandMark />
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <Link href="/" prefetch={false} className={navLink}>
            Home
          </Link>
          <Link href={catalogHref({})} prefetch className={navLink}>
            Shop
          </Link>
          <Link href="/support" prefetch={false} className={navLink}>
            Support
          </Link>
          <Link href="/admin" prefetch={false} className={navLink}>
            Admin
          </Link>
          <ThemeToggle className="mx-1" />
          <Link
            href="/cart"
            prefetch={false}
            className={cn(
              navLink,
              "btn-glass btn-glass-accent pressable-bouncy font-medium",
            )}
          >
            Cart {count > 0 && `(${count})`}
          </Link>
        </nav>
      </div>
    </header>
  );
}
