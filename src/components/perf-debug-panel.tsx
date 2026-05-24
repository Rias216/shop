"use client";

import { useEffect, useState } from "react";

type VitalEntry = {
  name: string;
  value: number;
  rating?: string;
  at: string;
};

declare global {
  interface Window {
    __SHOP_PERF__?: {
      vitals: VitalEntry[];
    };
  }
}

export function recordShopVital(name: string, value: number, rating?: string) {
  if (typeof window === "undefined") return;
  const store = window.__SHOP_PERF__ ?? { vitals: [] };
  store.vitals = [
    { name, value, rating, at: new Date().toISOString() },
    ...store.vitals.filter((v) => v.name !== name).slice(0, 7),
  ];
  window.__SHOP_PERF__ = store;
  window.dispatchEvent(new CustomEvent("shop-perf-update"));
}

export function PerfDebugPanel() {
  const enabled = process.env.NEXT_PUBLIC_PERF_DEBUG === "1";
  const [vitals, setVitals] = useState<VitalEntry[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const sync = () => setVitals(window.__SHOP_PERF__?.vitals ?? []);
    sync();
    window.addEventListener("shop-perf-update", sync);
    return () => window.removeEventListener("shop-perf-update", sync);
  }, [enabled]);

  if (!enabled || vitals.length === 0) return null;

  return (
    <div
      className="fixed bottom-2 right-2 z-[9999] max-w-[220px] rounded border border-white/10 bg-black/80 px-2 py-1.5 font-mono text-[10px] leading-tight text-green-400 pointer-events-none"
      aria-hidden
    >
      <div className="mb-1 font-semibold text-white/70">perf debug</div>
      {vitals.map((v) => (
        <div key={v.name}>
          {v.name}: {v.value.toFixed(1)}
          {v.rating ? ` (${v.rating})` : ""}
        </div>
      ))}
    </div>
  );
}
