import { createHmac } from "node:crypto";
import { timingSafeEqual } from "node:crypto";
import { getStoreSettings, isNowPaymentsConfigured } from "@/lib/settings";
import type { StoreSettings } from "@/generated/prisma/client";

import { PRIMARY_CRYPTO_CURRENCIES } from "@/lib/payments/crypto-currencies";

export { PRIMARY_CRYPTO_CURRENCIES, type PrimaryCryptoPayCurrency } from "@/lib/payments/crypto-currencies";

const API_BASE = "https://api.nowpayments.io/v1";
const CURRENCY_CODE = /^[a-z0-9]{2,12}$/;
const PAID_STATUSES = new Set(["finished", "confirmed"]);
const FAILED_STATUSES = new Set(["failed", "expired", "canceled"]);
const REFUNDED_STATUSES = new Set(["refunded"]);

export type NowPaymentsInvoice = {
  id: string;
  invoiceUrl: string;
};

export type NowPaymentsPaymentState = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | null;

function config(settings: StoreSettings) {
  if (!isNowPaymentsConfigured(settings)) return null;
  return {
    apiKey: settings.nowpaymentsApiKey,
    ipnSecret: settings.nowpaymentsIpnSecret,
  };
}

export async function createNowPaymentsInvoice(params: {
  orderId: string;
  totalCents: number;
  buyerEmail: string;
  successUrl: string;
  cancelUrl: string;
  ipnUrl: string;
  /** Lowercase NOWPayments ticker; omit to let the customer pick on the invoice page. */
  payCurrency?: string | null;
}): Promise<NowPaymentsInvoice> {
  const settings = await getStoreSettings();
  const cfg = config(settings);
  if (!cfg) {
    throw new Error("Crypto payments are not configured. Add a NOWPayments API key in Admin → Settings.");
  }

  const priceAmount = Number((params.totalCents / 100).toFixed(2));

  const payload: Record<string, unknown> = {
    price_amount: priceAmount,
    price_currency: "usd",
    order_id: params.orderId,
    order_description: `Order ${params.orderId.slice(-8)}`,
    ipn_callback_url: params.ipnUrl,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    is_fixed_rate: true,
    is_fee_paid_by_user: false,
  };
  if (params.payCurrency) {
    payload.pay_currency = params.payCurrency.toLowerCase();
  }

  const res = await fetch(`${API_BASE}/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": cfg.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NOWPayments invoice failed: ${err}`);
  }

  const data = (await res.json()) as {
    id?: string | number;
    invoice_id?: string | number;
    invoice_url?: string;
  };

  const id = String(data.id ?? data.invoice_id ?? "");
  const invoiceUrl = data.invoice_url;
  if (!id || !invoiceUrl) {
    throw new Error("NOWPayments returned an invalid invoice response");
  }

  return { id, invoiceUrl };
}

export function normalizeCurrencyCode(code: string): string {
  return code.trim().toLowerCase();
}

export function isValidCurrencyCode(code: string): boolean {
  return CURRENCY_CODE.test(normalizeCurrencyCode(code));
}

/** Currencies enabled on the merchant NOWPayments account. */
export async function fetchNowPaymentsCurrencies(): Promise<string[]> {
  const settings = await getStoreSettings();
  const cfg = config(settings);
  if (!cfg) return [];

  const res = await fetch(`${API_BASE}/currencies`, {
    headers: { "x-api-key": cfg.apiKey },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { currencies?: string[] };
  const list = data.currencies ?? [];
  return [...new Set(list.map(normalizeCurrencyCode).filter(isValidCurrencyCode))].sort();
}

export async function assertPayCurrencyAllowed(code: string): Promise<string> {
  const normalized = normalizeCurrencyCode(code);
  if (!isValidCurrencyCode(normalized)) {
    throw new Error("Invalid cryptocurrency.");
  }
  const available = await fetchNowPaymentsCurrencies();
  if (available.length > 0 && !available.includes(normalized)) {
    throw new Error("That cryptocurrency is not available right now. Pick another coin.");
  }
  return normalized;
}

function normalizeProviderStatus(value: unknown): string | null {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw || null;
}

function mapProviderStatus(raw: string | null): NowPaymentsPaymentState {
  if (!raw) return null;
  if (PAID_STATUSES.has(raw)) return "COMPLETED";
  if (FAILED_STATUSES.has(raw)) return "FAILED";
  if (REFUNDED_STATUSES.has(raw)) return "REFUNDED";
  return "PENDING";
}

/**
 * Pull latest payment state for an invoice directly from NOWPayments.
 * Used as a truth-source fallback when webhook delivery is delayed/missed.
 */
export async function fetchNowPaymentsInvoiceState(
  invoiceId: string,
): Promise<NowPaymentsPaymentState> {
  const settings = await getStoreSettings();
  const cfg = config(settings);
  if (!cfg || !invoiceId) return null;

  const res = await fetch(`${API_BASE}/invoice/${invoiceId}`, {
    headers: { "x-api-key": cfg.apiKey },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as Record<string, unknown>;
  const direct = mapProviderStatus(
    normalizeProviderStatus(
      data.payment_status ?? data.invoice_status ?? data.order_status ?? data.status,
    ),
  );
  if (direct) return direct;

  const payments = Array.isArray(data.payments) ? data.payments : [];
  const states = payments
    .map((entry) =>
      mapProviderStatus(normalizeProviderStatus((entry as Record<string, unknown>)?.payment_status)),
    )
    .filter(Boolean) as Exclude<NowPaymentsPaymentState, null>[];
  if (states.includes("COMPLETED")) return "COMPLETED";
  if (states.includes("REFUNDED")) return "REFUNDED";
  if (states.includes("FAILED")) return "FAILED";
  if (states.includes("PENDING")) return "PENDING";
  return null;
}

/** Verify NOWPayments IPN signature (HMAC-SHA512 of sorted JSON). */
export function verifyNowPaymentsIpnSignature(
  signature: string | null,
  body: Record<string, unknown>,
  ipnSecret: string,
): boolean {
  if (!signature || !ipnSecret) return false;

  const sorted = sortObject(body);
  const payload = JSON.stringify(sorted);
  const expected = createHmac("sha512", ipnSecret).update(payload).digest("hex");
  if (signature.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    const val = obj[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      out[key] = sortObject(val as Record<string, unknown>);
    } else {
      out[key] = val;
    }
  }
  return out;
}
