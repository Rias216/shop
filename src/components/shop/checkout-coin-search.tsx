"use client";

import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

/** Lightweight coin filter — instant, minimal DOM, subtle focus styling. */
export function CheckoutCoinSearch({
  value,
  onChange,
  placeholder = "Filter coins…",
  className,
}: Props) {
  return (
    <div className={cn("checkout-coin-search", className)}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="checkout-coin-search-input"
        autoComplete="off"
        spellCheck={false}
        aria-label="Filter cryptocurrencies"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="checkout-coin-search-clear"
          aria-label="Clear filter"
        >
          ×
        </button>
      )}
    </div>
  );
}
