"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HOT_ROUTES = ["/catalog", "/cart", "/checkout", "/support"] as const;
const PRELOAD_DELAY_MS = 800;
const prefetchedHrefs = new Set<string>();

function scheduleIdle(callback: () => void, fallbackMs: number) {
  if (typeof requestIdleCallback !== "undefined") {
    return requestIdleCallback(callback, { timeout: fallbackMs });
  }
  return window.setTimeout(callback, fallbackMs);
}

function cancelIdle(id: number) {
  if (typeof cancelIdleCallback !== "undefined") {
    cancelIdleCallback(id);
    return;
  }
  window.clearTimeout(id);
}

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

    const idleId = scheduleIdle(() => {
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
      cancelIdle(idleId);
      document.removeEventListener("mouseover", onMouseOver);
    };
  }, [router]);

  return null;
}
