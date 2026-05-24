"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckoutCoinSearch } from "@/components/shop/checkout-coin-search";
import { CheckoutExpand } from "@/components/shop/checkout-expand";
import { CryptoCoinIcon } from "@/components/shop/crypto-icon";
import {
  PRIMARY_CRYPTO_CURRENCIES,
  type PrimaryCryptoPayCurrency,
} from "@/lib/payments/crypto-currencies";
import { getCryptoDisplay } from "@/lib/payments/crypto-display";
import { getStoredThemeChoice, resolveTheme } from "@/lib/theme-client";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  cryptoEnabled: boolean;
  directContactEmails: [string, string];
  couponCode?: string;
  orderTotalCents: number;
};

type CryptoSelection =
  | { bucket: "primary"; code: PrimaryCryptoPayCurrency }
  | { bucket: "other"; code: string };

const SEARCH_RESULT_LIMIT = 40;

const PRIMARY_META: Record<
  PrimaryCryptoPayCurrency,
  { title: string; description: string }
> = {
  btc: { title: "Bitcoin (BTC)", description: "On-chain" },
  ltc: { title: "Litecoin (LTC)", description: "Fast confirmations" },
  xmr: { title: "Monero (XMR)", description: "Private" },
  sol: { title: "Solana (SOL)", description: "Low fees" },
  xrp: { title: "XRP", description: "Ripple network" },
  usdt: { title: "Tether (USDT)", description: "USD stablecoin" },
};

export function CheckoutForm({
  cryptoEnabled,
  directContactEmails,
  couponCode,
  orderTotalCents,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [selectedCrypto, setSelectedCrypto] = useState<CryptoSelection>({
    bucket: "primary",
    code: "btc",
  });
  const [otherCurrencies, setOtherCurrencies] = useState<string[]>([]);
  const [featuredCurrencies, setFeaturedCurrencies] = useState<string[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(false);
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [showMoreCrypto, setShowMoreCrypto] = useState(false);
  const [showDirectPay, setShowDirectPay] = useState(false);

  const [ordersEmail, paymentsEmail] = directContactEmails;
  const isSearching = currencyFilter.trim().length > 0;

  async function loadOtherCurrencies() {
    if (currenciesLoading) return;
    setCurrenciesLoading(true);
    try {
      const r = await fetch("/api/payments/nowpayments-currencies");
      const data = (await r.json()) as { other?: string[]; featured?: string[] };
      const list = data.other ?? [];
      const featured = data.featured ?? [];
      setOtherCurrencies(list);
      setFeaturedCurrencies(featured);
    } catch {
      setOtherCurrencies([]);
      setFeaturedCurrencies([]);
    } finally {
      setCurrenciesLoading(false);
    }
  }

  const { displayedOtherCoins, searchResultCapped } = useMemo(() => {
    const q = currencyFilter.trim().toLowerCase();
    if (q) {
      const matches = otherCurrencies.filter((c) => c.includes(q));
      return {
        displayedOtherCoins: matches.slice(0, SEARCH_RESULT_LIMIT),
        searchResultCapped: matches.length > SEARCH_RESULT_LIMIT,
      };
    }
    return { displayedOtherCoins: featuredCurrencies, searchResultCapped: false };
  }, [currencyFilter, otherCurrencies, featuredCurrencies]);

  function selectPrimary(code: PrimaryCryptoPayCurrency) {
    setSelectedCrypto({ bucket: "primary", code });
  }

  function selectOther(code: string) {
    setSelectedCrypto({ bucket: "other", code: code.toLowerCase() });
  }

  function resolveCheckoutPayload():
    | { paymentMethod: "CRYPTO"; cryptoCurrency: string; couponCode?: string }
    | null {
    if (!cryptoEnabled) return null;
    const code = selectedCrypto.code.trim().toLowerCase();
    if (!code) return null;
    return {
      paymentMethod: "CRYPTO",
      cryptoCurrency: code,
      couponCode,
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!ageConfirmed || !termsAccepted) {
      setError("Please confirm age and accept terms.");
      return;
    }
    const payment = resolveCheckoutPayload();
    if (!payment) {
      setError("Select a cryptocurrency.");
      return;
    }
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          name: data.get("name"),
          line1: data.get("line1"),
          line2: data.get("line2"),
          city: data.get("city"),
          state: data.get("state"),
          postalCode: data.get("postalCode"),
          country: data.get("country"),
          theme: resolveTheme(getStoredThemeChoice()),
          ...payment,
          ageConfirmed,
          termsAccepted,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        redirectUrl?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Checkout failed");
        return;
      }
      if (json.redirectUrl) {
        window.location.href = json.redirectUrl;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function PaymentCard({
    active,
    onSelect,
    coinCode,
    title,
    description,
    className,
  }: {
    active: boolean;
    onSelect: () => void;
    coinCode: string;
    title: string;
    description: string;
    className?: string;
  }) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "payment-option flex w-full cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
          active
            ? "border-accent bg-accent/10 ring-1 ring-accent/30"
            : "border-[var(--outline-strong)] bg-[var(--glass-bg-subtle)] hover:border-accent/40",
          className,
        )}
      >
        <CryptoCoinIcon code={coinCode} className="mt-0.5" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-foreground">{title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        </span>
      </button>
    );
  }

  function renderOtherCoinCards(coins: string[]) {
    return coins.map((code) => {
      const display = getCryptoDisplay(code);
      const active = selectedCrypto.bucket === "other" && selectedCrypto.code === code;
      return (
        <PaymentCard
          key={code}
          active={active}
          onSelect={() => selectOther(code)}
          coinCode={code}
          title={display.title}
          description={display.description}
        />
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Contact</legend>
        <p>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required className="mt-1" />
        </p>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Shipping</legend>
        <p>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" required className="mt-1" />
        </p>
        <p>
          <Label htmlFor="line1">Address line 1</Label>
          <Input id="line1" name="line1" required className="mt-1" />
        </p>
        <p>
          <Label htmlFor="line2">Address line 2</Label>
          <Input id="line2" name="line2" className="mt-1" />
        </p>
        <p>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required className="mt-1" />
        </p>
        <p>
          <Label htmlFor="state">State / region</Label>
          <Input id="state" name="state" className="mt-1" />
        </p>
        <p>
          <Label htmlFor="postalCode">Postal code</Label>
          <Input id="postalCode" name="postalCode" required className="mt-1" />
        </p>
        <p>
          <Label htmlFor="country">Country (ISO code, e.g. GB)</Label>
          <Input
            id="country"
            name="country"
            required
            maxLength={2}
            className="mt-1 uppercase"
          />
        </p>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold">Payment</legend>
        {!cryptoEnabled && (
          <p className="text-sm text-red-600">
            Cryptocurrency checkout is not enabled. Configure NOWPayments in Admin → Settings.
          </p>
        )}
        <div className="space-y-3">
          {cryptoEnabled && (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cryptocurrency
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PRIMARY_CRYPTO_CURRENCIES.map((code) => {
                  const meta = PRIMARY_META[code];
                  const active =
                    selectedCrypto.bucket === "primary" && selectedCrypto.code === code;
                  return (
                    <PaymentCard
                      key={code}
                      active={active}
                      onSelect={() => selectPrimary(code)}
                      coinCode={code}
                      title={meta.title}
                      description={meta.description}
                    />
                  );
                })}
              </div>

              <CheckoutExpand
                label="More cryptocurrencies"
                description="ETH, USDC, DOGE, and search 300+ more"
                checked={showMoreCrypto}
                onCheckedChange={(open) => {
                  setShowMoreCrypto(open);
                  if (open && otherCurrencies.length === 0 && featuredCurrencies.length === 0) {
                    void loadOtherCurrencies();
                  }
                  if (!open) {
                    setCurrencyFilter("");
                    if (selectedCrypto.bucket === "other") {
                      setSelectedCrypto({ bucket: "primary", code: "btc" });
                    }
                  }
                }}
              >
                <CheckoutCoinSearch
                  value={currencyFilter}
                  onChange={setCurrencyFilter}
                  placeholder="Ticker (e.g. eth, doge)…"
                />
                {currenciesLoading ? (
                  <p className="px-1 text-xs text-muted-foreground">Loading coins…</p>
                ) : displayedOtherCoins.length === 0 ? (
                  <p className="px-1 text-xs text-muted-foreground">No matches.</p>
                ) : (
                  <div
                    className={cn(
                      "grid gap-2 sm:grid-cols-2",
                      isSearching && "checkout-crypto-scroll",
                    )}
                  >
                    {renderOtherCoinCards(displayedOtherCoins)}
                  </div>
                )}
                {!isSearching && otherCurrencies.length > featuredCurrencies.length && (
                  <p className="text-xs text-muted-foreground">
                    Search for {otherCurrencies.length - featuredCurrencies.length} more coins.
                  </p>
                )}
                {searchResultCapped && (
                  <p className="text-xs text-muted-foreground">
                    Showing first {SEARCH_RESULT_LIMIT} matches — refine your search.
                  </p>
                )}
              </CheckoutExpand>
            </>
          )}

          <CheckoutExpand
            label="Direct payment methods"
            description="Wire, ACH, Zelle — contact us by email"
            checked={showDirectPay}
            onCheckedChange={setShowDirectPay}
          >
            <p className="text-xs leading-relaxed text-muted-foreground">
              Email us before or after placing your order to arrange payment:
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                <a href={`mailto:${ordersEmail}`} className="font-medium text-accent hover:underline">
                  {ordersEmail}
                </a>
                <span className="text-muted-foreground"> — orders &amp; checkout help</span>
              </li>
              <li>
                <a
                  href={`mailto:${paymentsEmail}`}
                  className="font-medium text-accent hover:underline"
                >
                  {paymentsEmail}
                </a>
                <span className="text-muted-foreground"> — payment options &amp; invoicing</span>
              </li>
            </ul>
          </CheckoutExpand>
        </div>

        {cryptoEnabled && (
          <p className="text-xs text-muted-foreground">
            Crypto checkout uses NOWPayments — you complete payment on their secure page.
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-3 rounded-md border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4">
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked={ageConfirmed} onCheckedChange={(v) => setAgeConfirmed(v === true)} />
          I confirm I am 18 years or older.
        </label>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(v === true)} />
          I agree to the research-use-only terms and accept full responsibility for compliance
          with local laws.
        </label>
      </fieldset>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        type="submit"
        size="lg"
        disabled={loading || !cryptoEnabled}
        className="w-full"
      >
        {loading ? "Processing…" : `Place order — ${formatPrice(orderTotalCents)}`}
      </Button>
    </form>
  );
}
