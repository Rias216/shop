"use client";

import { useReportWebVitals } from "next/web-vitals";
import { recordShopVital } from "@/components/perf-debug-panel";

type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  delta?: number;
  navigationType?: string;
};

const PERF_LOG_ENABLED = process.env.NEXT_PUBLIC_PERF_LOG === "1";
const PERF_DEBUG_ENABLED = process.env.NEXT_PUBLIC_PERF_DEBUG === "1";

export function WebVitals() {
  useReportWebVitals((metric: WebVitalMetric) => {
    if (PERF_LOG_ENABLED) {
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
    }
    if (PERF_DEBUG_ENABLED) {
      recordShopVital(metric.name, metric.value, metric.rating);
    }
  });

  return null;
}
