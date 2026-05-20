const PERF_ENABLED = process.env.NEXT_PUBLIC_PERF_LOG === "1";

if (typeof window !== "undefined" && PERF_ENABLED) {
  let observer: PerformanceObserver | null = null;

  if ("PerformanceObserver" in window) {
    observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const longTask = entry as PerformanceEntry & { attribution?: unknown };
        console.info(
          "[perf:long-task]",
          JSON.stringify({
            name: longTask.name,
            durationMs: Number(longTask.duration.toFixed(2)),
            startMs: Number(longTask.startTime.toFixed(2)),
          }),
        );
      }
    });

    try {
      observer.observe({ type: "longtask", buffered: true });
    } catch {
      // Unsupported in some browsers.
    }
  }
}
