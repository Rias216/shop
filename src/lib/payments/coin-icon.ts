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

export function isSolanaCoinKey(code: string): boolean {
  const key = normalizeCoinIconKey(code);
  return key === "sol" || key === "solana";
}

/** Official Solana logomark (Trust Wallet assets registry, from Solana Foundation). */
export const SOLANA_ICON_URL =
  "https://assets-cdn.trustwallet.com/blockchains/solana/info/logo.png";

/** Official Litecoin logomark (Trust Wallet assets registry). */
export const LITECOIN_ICON_URL =
  "https://assets-cdn.trustwallet.com/blockchains/litecoin/info/logo.png";

const OFFICIAL_COIN_ICON_URLS: Record<string, string> = {
  sol: SOLANA_ICON_URL,
  solana: SOLANA_ICON_URL,
  ltc: LITECOIN_ICON_URL,
  litecoin: LITECOIN_ICON_URL,
};

/** Official logos from spothq/cryptocurrency-icons (SVG/PNG pack). */
export function getCoinIconUrl(code: string): string {
  const key = normalizeCoinIconKey(code);
  const official = OFFICIAL_COIN_ICON_URLS[key];
  if (official) return official;
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${key}.png`;
}

/** Brand accent colors for fallback badges and icon glows. */
const COIN_ACCENT_COLORS: Record<string, string> = {
  btc: "#F7931A",
  ltc: "#345D9D",
  litecoin: "#345D9D",
  xmr: "#FF6600",
  sol: "#9945FF",
  solana: "#9945FF",
  xrp: "#0085C3",
  usdt: "#26A17B",
  eth: "#627EEA",
  usdc: "#2775CA",
  doge: "#C2A633",
};

/** Stable accent for fallback badge when CDN misses. */
export function coinAccentColor(code: string): string {
  const key = normalizeCoinIconKey(code) || code;
  const brand = COIN_ACCENT_COLORS[key];
  if (brand) return brand;

  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return `hsl(${h % 360} 52% 40%)`;
}

/** Soft anti-aliased glow for circular coin icons (uses filter, not hard box-shadow rings). */
export function coinIconGlowFilter(color: string): string {
  return [
    `drop-shadow(0 0 1px color-mix(in srgb, ${color} 85%, transparent))`,
    `drop-shadow(0 0 5px color-mix(in srgb, ${color} 55%, transparent))`,
    `drop-shadow(0 0 10px color-mix(in srgb, ${color} 35%, transparent))`,
  ].join(" ");
}

/** Selected payment card glow matched to coin brand color. */
export function coinPaymentCardGlow(color: string): string {
  return [
    `0 0 0 1px color-mix(in srgb, ${color} 42%, transparent)`,
    `0 0 16px color-mix(in srgb, ${color} 32%, transparent)`,
    `0 0 28px color-mix(in srgb, ${color} 14%, transparent)`,
    `inset 0 0 18px color-mix(in srgb, ${color} 7%, transparent)`,
  ].join(", ");
}
