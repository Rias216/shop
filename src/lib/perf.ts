import "server-only";

type PerfFields = Record<string, string | number | boolean | null | undefined>;

type PerfStep = {
  name: string;
  ms: number;
};

const PERF_LOG_ENABLED = process.env.PERF_LOG === "1";
const PERF_DEBUG_ENABLED = process.env.PERF_DEBUG === "1";

const nowMs = () => {
  if (typeof performance !== "undefined") {
    return performance.now();
  }
  return Date.now();
};

function serializeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function shouldTimeSteps(): boolean {
  return PERF_LOG_ENABLED || PERF_DEBUG_ENABLED;
}

function createPerf(scope: string, logTag: "request" | "page", initial: PerfFields = {}) {
  const requestStart = nowMs();
  const fields: PerfFields = { ...initial };
  const steps: PerfStep[] = [];

  const setFields = (next: PerfFields) => {
    if (!shouldTimeSteps()) return;
    Object.assign(fields, next);
  };

  const time = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    if (!shouldTimeSteps()) return fn();
    const start = nowMs();
    try {
      return await fn();
    } finally {
      steps.push({ name, ms: Number((nowMs() - start).toFixed(2)) });
    }
  };

  const flush = (extra: PerfFields = {}) => {
    const totalMs = Number((nowMs() - requestStart).toFixed(2));
    if (PERF_LOG_ENABLED) {
      console.info(
        `[perf:${logTag}]`,
        JSON.stringify({
          scope,
          totalMs,
          ...fields,
          ...extra,
          steps,
        }),
      );
    }
    if (PERF_DEBUG_ENABLED && steps.length > 0 && PERF_LOG_ENABLED === false) {
      console.info(
        `[perf:${logTag}:debug]`,
        JSON.stringify({ scope, totalMs, steps }),
      );
    }
  };

  const fail = (error: unknown, extra: PerfFields = {}) => {
    flush({
      ok: false,
      error: serializeError(error),
      ...extra,
    });
  };

  return { setFields, time, flush, fail };
}

export function createRequestPerf(scope: string, initial: PerfFields = {}) {
  return createPerf(scope, "request", initial);
}

export function createPagePerf(page: string, initial: PerfFields = {}) {
  return createPerf(page, "page", initial);
}
