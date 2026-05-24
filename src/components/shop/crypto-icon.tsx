"use client";

import { useState } from "react";
import {
  coinAccentColor,
  coinIconGlowFilter,
  getCoinIconUrl,
  normalizeCoinIconKey,
} from "@/lib/payments/coin-icon";
import { cn } from "@/lib/utils";

/** PayPal only — checkout crypto uses official CDN logos. */
export type CryptoIconId = "paypal";

type Props = { id: CryptoIconId; className?: string };

const ICON_SIZE = "h-8 w-8";

function coinIconStyle(code: string): React.CSSProperties {
  const color = coinAccentColor(normalizeCoinIconKey(code) || code);
  return {
    filter: coinIconGlowFilter(color),
    WebkitBackfaceVisibility: "hidden",
    backfaceVisibility: "hidden",
    transform: "translateZ(0)",
  };
}

function ColoredTickerIcon({ code, className }: { code: string; className?: string }) {
  const key = normalizeCoinIconKey(code) || code;
  const label = key.toUpperCase().slice(0, 4);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-[0.52rem] font-bold leading-none text-white",
        ICON_SIZE,
        className,
      )}
      style={{ background: coinAccentColor(key), ...coinIconStyle(code) }}
      aria-hidden
    >
      {label}
    </span>
  );
}

/**
 * Official logos via spothq/cryptocurrency-icons and Trust Wallet assets (Solana, Litecoin).
 * @see https://github.com/spothq/cryptocurrency-icons
 * @see https://github.com/trustwallet/assets
 */
function OfficialCoinIcon({ code, className }: { code: string; className?: string }) {
  const key = normalizeCoinIconKey(code);
  const [failed, setFailed] = useState(false);

  if (!key || failed) {
    return <ColoredTickerIcon code={code} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- official third-party logo CDN
    <img
      src={getCoinIconUrl(key)}
      alt=""
      width={32}
      height={32}
      loading="lazy"
      decoding="async"
      className={cn("block shrink-0 rounded-full object-cover antialiased", ICON_SIZE, className)}
      style={coinIconStyle(code)}
      onError={() => setFailed(true)}
    />
  );
}

export function CryptoCoinIcon({ code, className }: { code: string; className?: string }) {
  return <OfficialCoinIcon code={code} className={className} />;
}

export function CryptoIconOrTicker({ code, className }: { code: string; className?: string }) {
  return <CryptoCoinIcon code={code} className={className} />;
}

export function CryptoIcon({ id, className }: Props) {
  if (id !== "paypal") return null;
  const base = cn("h-6 w-6 shrink-0", className);
  return (
    <svg viewBox="0 0 32 32" className={base} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#003087" />
      <path
        fill="#fff"
        d="M12.2 9h5.8c2.8 0 4.2 1.4 3.8 3.5-.4 2.3-2.4 3.5-5 3.5h-1.8l-.7 3.5H9.5l2.7-10.5zm2.2 6h1.4c1.2 0 2-.5 2.2-1.5.2-1-.4-1.5-1.6-1.5h-1.3l-.7 3z"
      />
    </svg>
  );
}
