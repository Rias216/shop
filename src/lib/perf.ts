import "server-only";

type PerfFields = Record<string, string | number | boolean | null | undefined>;

type PerfStep = {
  name: string;
  ms: number;
};

const PERF_ENABLED = process.env.PERF_LOG === "1";

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

export function createRequestPerf(scope: string, initial: PerfFields = {}) {
  const requestStart = nowMs();
  const fields: PerfFields = { ...initial };
  const steps: PerfStep[] = [];

  const setFields = (next: PerfFields) => {
    if (!PERF_ENABLED) return;
    Object.assign(fields, next);
  };

  const time = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    if (!PERF_ENABLED) return fn();
    const start = nowMs();
    try {
      return await fn();
    } finally {
      steps.push({ name, ms: Number((nowMs() - start).toFixed(2)) });
    }
  };

  const flush = (extra: PerfFields = {}) => {
    if (!PERF_ENABLED) return;
    const totalMs = Number((nowMs() - requestStart).toFixed(2));
    console.info(
      "[perf:request]",
      JSON.stringify({
        scope,
        totalMs,
        ...fields,
        ...extra,
        steps,
      }),
    );
  };

  const fail = (error: unknown, extra: PerfFields = {}) => {
    if (!PERF_ENABLED) return;
    flush({
      ok: false,
      error: serializeError(error),
      ...extra,
    });
  };

  return { setFields, time, flush, fail };
}
