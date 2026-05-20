/** Normalize NOWPayments tickers for icon lookup (e.g. usdttrc20 → usdt). */
export function normalizeCoinIconKey(code: string): string {
  const raw = code.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!raw) return "";

  const networks = [
    "trc20",
    "erc20",
    "bep20",
    "bep2",
    "bsc",
    "matic",
    "polygon",
    "sol",
    "arb",
    "avax",
    "base",
    "opt",
    "op",
    "mainnet",
  ];
  for (const net of networks) {
    if (raw.endsWith(net) && raw.length > net.length + 1) {
      return raw.slice(0, -net.length);
    }
  }
  return raw;
}

/** Official logos from spothq/cryptocurrency-icons (SVG/PNG pack). */
export function getCoinIconUrl(code: string): string {
  const key = normalizeCoinIconKey(code);
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${key}.png`;
}

/** Stable accent for fallback badge when CDN misses. */
export function coinAccentColor(code: string): string {
  let h = 0;
  const key = normalizeCoinIconKey(code) || code;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return `hsl(${h % 360} 52% 40%)`;
}
