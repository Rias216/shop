"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";

const AddToCartControls = dynamic(
  () => import("@/components/shop/add-to-cart-controls").then((m) => m.AddToCartControls),
  { ssr: false },
);

type Props = ComponentProps<typeof AddToCartControls>;

/** Loads add-to-cart JS only when the card enters (or nears) the viewport. */
export function LazyAddToCartControls(props: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={rootRef} className="min-h-9 w-full">
      {visible ? <AddToCartControls {...props} /> : null}
    </div>
  );
}
