"use client";

import { useEffect, useRef } from "react";

type Props = {
  animKey: string;
  children: React.ReactNode;
};

/** Restarts float-in animation whenever search/filter key changes */
export function ProductGridAnimated({ animKey, children }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const grid = host.querySelector<HTMLElement>(".product-grid");

    host.classList.remove("catalog-float--play");
    grid?.classList.remove("product-grid--play");

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (reducedMotion) return;

    rafRef.current = requestAnimationFrame(() => {
      host.classList.add("catalog-float--play");
      grid?.classList.add("product-grid--play");
      rafRef.current = null;
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [animKey]);

  return (
    <div ref={hostRef} className="catalog-grid-host catalog-float--play">
      {children}
    </div>
  );
}
