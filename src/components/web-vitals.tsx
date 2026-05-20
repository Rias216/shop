"use client";

import { useReportWebVitals } from "next/web-vitals";

type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  delta?: number;
  navigationType?: string;
};

const PERF_ENABLED = process.env.NEXT_PUBLIC_PERF_LOG === "1";

/**
 * Dev/prod opt-in Web Vitals logger (Next docs: keep this as a tiny isolated client boundary).
 */
export function WebVitals() {
  useReportWebVitals((metric: WebVitalMetric) => {
    if (!PERF_ENABLED) return;
    console.info(
      "[perf:web-vital]",
      JSON.stringify({
        id: metric.id,
        name: metric.name,
        value: Number(metric.value.toFixed(2)),
        rating: metric.rating,
        delta: metric.delta,
        navigationType: metric.navigationType,
      }),
    );
  });

  return null;
}
