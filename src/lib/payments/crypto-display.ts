/** Human-readable names for checkout coin labels. */
const COIN_NAMES: Record<string, string> = {
  btc: "Bitcoin",
  ltc: "Litecoin",
  xmr: "Monero",
  sol: "Solana",
  xrp: "XRP",
  zec: "Zcash",
  eth: "Ethereum",
  doge: "Dogecoin",
  usdt: "Tether",
  usdc: "USD Coin",
  trx: "TRON",
  bnb: "BNB",
  ada: "Cardano",
  dot: "Polkadot",
  matic: "Polygon",
  avax: "Avalanche",
  link: "Chainlink",
  dai: "Dai",
  shib: "Shiba Inu",
  bch: "Bitcoin Cash",
  xlm: "Stellar",
  uni: "Uniswap",
  etc: "Ethereum Classic",
  xtz: "Tezos",
  atom: "Cosmos",
  near: "NEAR",
  apt: "Aptos",
  ton: "Toncoin",
  arb: "Arbitrum",
  op: "Optimism",
  pepe: "Pepe",
};

export function getCryptoDisplay(code: string): { title: string; description: string } {
  const ticker = code.trim().toUpperCase();
  const key = code.trim().toLowerCase();
  const name = COIN_NAMES[key] ?? ticker;
  return {
    title: `${name} (${ticker})`,
    description: "Pay on NOWPayments",
  };
}
