"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HOT_ROUTES = ["/catalog", "/cart", "/checkout", "/support"] as const;
const PRELOAD_DELAY_MS = 800;
const prefetchedHrefs = new Set<string>();

/**
 * Intent-friendly route prefetch for near-instant top-nav transitions without
 * globally enabling aggressive Link prefetch on every product card/list item.
 */
export function InstantPrefetch() {
  const router = useRouter();

  useEffect(() => {
    const prefetchOnce = (href: string) => {
      if (!href.startsWith("/")) return;
      if (href.startsWith("/api")) return;
      if (prefetchedHrefs.has(href)) return;
      prefetchedHrefs.add(href);
      router.prefetch(href);
    };

    const id = window.setTimeout(() => {
      for (const route of HOT_ROUTES) {
        prefetchOnce(route);
      }
    }, PRELOAD_DELAY_MS);

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const hrefAttr = anchor.getAttribute("href");
      if (!hrefAttr) return;
      if (hrefAttr.startsWith("http://") || hrefAttr.startsWith("https://")) return;
      if (hrefAttr.startsWith("mailto:") || hrefAttr.startsWith("tel:")) return;
      prefetchOnce(hrefAttr);
    };

    document.addEventListener("mouseover", onMouseOver, { passive: true });
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mouseover", onMouseOver);
    };
  }, [router]);

  return null;
}
