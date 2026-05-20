/** Checkout quick-pick coins (order shown on payment step). */
export const PRIMARY_CRYPTO_CURRENCIES = ["btc", "ltc", "xmr", "sol", "xrp", "usdt"] as const;
export type PrimaryCryptoPayCurrency = (typeof PRIMARY_CRYPTO_CURRENCIES)[number];

/** Popular coins shown under primaries (must not overlap PRIMARY list). */
export const POPULAR_OTHER_CRYPTO = ["eth", "usdc", "doge", "trx", "zec"] as const;

const PRIMARY_SET = new Set<string>(PRIMARY_CRYPTO_CURRENCIES);

export function pickFeaturedOtherCoins(available: string[], limit = 5): string[] {
  const availableSet = new Set(available.map((c) => c.toLowerCase()));
  const picked: string[] = [];

  for (const code of POPULAR_OTHER_CRYPTO) {
    if (availableSet.has(code) && !PRIMARY_SET.has(code)) {
      picked.push(code);
    }
    if (picked.length >= limit) return picked;
  }

  for (const code of available) {
    const c = code.toLowerCase();
    if (picked.length >= limit) break;
    if (!PRIMARY_SET.has(c) && !picked.includes(c)) picked.push(c);
  }

  return picked;
}
