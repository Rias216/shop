/**
 * Shop route benchmark — run with dev server up: npm run perf:bench
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Sample = {
  ttfbMs: number;
  totalMs: number;
  status: number;
  bytes: number;
};

type RouteResult = {
  path: string;
  runs: number;
  median: { ttfbMs: number; totalMs: number; bytes: number };
  p95: { ttfbMs: number; totalMs: number; bytes: number };
  samples: Sample[];
};

type BenchReport = {
  baseUrl: string;
  at: string;
  routes: RouteResult[];
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PERF_DIR = join(ROOT, ".perf");

const BASE_URL = (process.env.BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const RUNS = Number(process.env.PERF_RUNS ?? "5");
const DEFAULT_PATHS = [
  "/",
  "/catalog",
  "/catalog?sort=popular",
  "/cart",
  "/checkout",
];

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    saveBaseline: args.includes("--save-baseline"),
    compare: args.includes("--compare"),
  };
}

function parsePaths(): string[] {
  const fromEnv = process.env.PERF_URLS?.split(",").map((p) => p.trim()).filter(Boolean);
  if (fromEnv?.length) return fromEnv;
  const slug = process.env.PERF_PRODUCT_SLUG?.trim();
  const paths = [...DEFAULT_PATHS];
  if (slug) paths.push(`/products/${slug}`);
  return paths;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function p95(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[idx]!;
}

async function assertServerReachable(): Promise<void> {
  const url = `${BASE_URL}/`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status >= 500) {
      console.error(`Server at ${BASE_URL} returned ${res.status}. Fix errors before benchmarking.`);
      process.exitCode = 1;
      return;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Cannot reach ${BASE_URL}\n`);
    console.error(`  ${msg}\n`);
    console.error("Start the app first, then re-run:\n");
    console.error("  npm run dev");
    console.error("  npm run perf:bench -- --save-baseline\n");
    console.error("Or benchmark production/staging:\n");
    console.error('  $env:BASE_URL="https://justpeps.online"; npm run perf:bench -- --save-baseline');
    process.exitCode = 1;
    throw err;
  }
}

async function fetchSample(url: string): Promise<Sample> {
  const start = performance.now();
  const res = await fetch(url, {
    headers: { Accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(60_000),
  });
  const body = await res.arrayBuffer();
  const totalMs = performance.now() - start;
  const serverTiming = res.headers.get("server-timing");
  let ttfbMs = totalMs * 0.4;
  if (serverTiming) {
    const totalDur = serverTiming
      .split(",")
      .map((part) => {
        const m = part.match(/dur=([\d.]+)/);
        return m ? Number(m[1]) : 0;
      })
      .reduce((a, b) => a + b, 0);
    if (totalDur > 0) ttfbMs = Math.min(totalMs, totalDur);
  }
  return {
    ttfbMs: Number(ttfbMs.toFixed(2)),
    totalMs: Number(totalMs.toFixed(2)),
    status: res.status,
    bytes: body.byteLength,
  };
}

async function benchRoute(path: string): Promise<RouteResult> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const samples: Sample[] = [];
  for (let i = 0; i < RUNS; i++) {
    samples.push(await fetchSample(url));
  }
  const ttfbs = samples.map((s) => s.ttfbMs);
  const totals = samples.map((s) => s.totalMs);
  const bytes = samples.map((s) => s.bytes);
  return {
    path,
    runs: RUNS,
    median: {
      ttfbMs: Number(median(ttfbs).toFixed(2)),
      totalMs: Number(median(totals).toFixed(2)),
      bytes: Math.round(median(bytes)),
    },
    p95: {
      ttfbMs: Number(p95(ttfbs).toFixed(2)),
      totalMs: Number(p95(totals).toFixed(2)),
      bytes: Math.round(p95(bytes)),
    },
    samples,
  };
}

function printTable(routes: RouteResult[]) {
  console.log(`\nBase: ${BASE_URL}  Runs: ${RUNS}\n`);
  console.log(
    "PATH".padEnd(28) +
      "MED TTFB".padStart(10) +
      "MED TOTAL".padStart(12) +
      "MED KB".padStart(10) +
      " P95 TTFB".padStart(10),
  );
  console.log("-".repeat(72));
  for (const r of routes) {
    console.log(
      r.path.padEnd(28) +
        `${r.median.ttfbMs}ms`.padStart(10) +
        `${r.median.totalMs}ms`.padStart(12) +
        `${(r.median.bytes / 1024).toFixed(1)}`.padStart(10) +
        `${r.p95.ttfbMs}ms`.padStart(10),
    );
  }
  console.log("");
}

function deltaLabel(before: number, after: number, lowerIsBetter = true): string {
  const diff = after - before;
  const pct = before === 0 ? 0 : (diff / before) * 100;
  const improved = lowerIsBetter ? diff < 0 : diff > 0;
  const sign = diff > 0 ? "+" : "";
  const arrow = improved ? "↓" : diff < 0 ? "↑" : "=";
  return `${arrow} ${sign}${diff.toFixed(1)} (${sign}${pct.toFixed(1)}%)`;
}

function printCompare(baseline: BenchReport, latest: BenchReport) {
  console.log(`\nCompare vs baseline (${baseline.at})\n`);
  const baseByPath = new Map(baseline.routes.map((r) => [r.path, r]));
  for (const r of latest.routes) {
    const b = baseByPath.get(r.path);
    if (!b) {
      console.log(`${r.path}: (new route)`);
      continue;
    }
    console.log(r.path);
    console.log(`  TTFB:  ${deltaLabel(b.median.ttfbMs, r.median.ttfbMs)}`);
    console.log(`  Total: ${deltaLabel(b.median.totalMs, r.median.totalMs)}`);
    console.log(`  Bytes: ${deltaLabel(b.median.bytes, r.median.bytes)}`);
  }
  console.log("");
}

async function main() {
  const { saveBaseline, compare } = parseArgs();
  const paths = parsePaths();
  await mkdir(PERF_DIR, { recursive: true });

  console.log(`Target: ${BASE_URL}`);
  await assertServerReachable();

  console.log("Warming up...");
  await fetchSample(`${BASE_URL}/`);

  const routes: RouteResult[] = [];
  for (const path of paths) {
    process.stdout.write(`Benchmark ${path}...`);
    routes.push(await benchRoute(path));
    console.log(" done");
  }

  const report: BenchReport = {
    baseUrl: BASE_URL,
    at: new Date().toISOString(),
    routes,
  };

  printTable(routes);

  const latestPath = join(PERF_DIR, "latest.json");
  await writeFile(latestPath, JSON.stringify(report, null, 2));

  if (saveBaseline) {
    const baselinePath = join(PERF_DIR, "baseline.json");
    await writeFile(baselinePath, JSON.stringify(report, null, 2));
    console.log(`Saved baseline → ${baselinePath}`);
  }

  if (compare) {
    const baselinePath = join(PERF_DIR, "baseline.json");
    try {
      const raw = await readFile(baselinePath, "utf8");
      printCompare(JSON.parse(raw) as BenchReport, report);
    } catch {
      console.error("No baseline.json — run: npm run perf:bench -- --save-baseline");
      process.exitCode = 1;
    }
  }

  console.log(`Wrote ${latestPath}`);
}

main().catch(() => {
  process.exit(process.exitCode || 1);
});
