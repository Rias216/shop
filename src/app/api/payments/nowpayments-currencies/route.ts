import { NextResponse } from "next/server";
import {
  pickFeaturedOtherCoins,
  PRIMARY_CRYPTO_CURRENCIES,
} from "@/lib/payments/crypto-currencies";
import { fetchNowPaymentsCurrencies } from "@/lib/payments/nowpayments";
import { getStoreSettings, isNowPaymentsConfigured } from "@/lib/settings";

export async function GET() {
  const settings = await getStoreSettings();
  if (!isNowPaymentsConfigured(settings)) {
    return NextResponse.json({ currencies: [] });
  }

  const currencies = await fetchNowPaymentsCurrencies();
  const primary = new Set<string>(PRIMARY_CRYPTO_CURRENCIES);
  const other = currencies.filter((c) => !primary.has(c));
  const featured = pickFeaturedOtherCoins(other, 5);

  return NextResponse.json({
    currencies,
    other,
    featured,
    primary: [...PRIMARY_CRYPTO_CURRENCIES],
  });
}
