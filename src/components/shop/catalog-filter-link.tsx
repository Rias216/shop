"use client";

import Link from "next/link";
import { useCatalogPending } from "@/components/shop/catalog-pending-context";

type Props = React.ComponentProps<typeof Link>;

/** Catalog filter navigation with transition pending state (no full route skeleton flash). */
export function CatalogFilterLink({ href, onClick, prefetch = true, ...props }: Props) {
  const { navigate } = useCatalogPending();

  return (
    <Link
      href={href}
      prefetch={prefetch}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(typeof href === "string" ? href : href.toString());
      }}
    />
  );
}
