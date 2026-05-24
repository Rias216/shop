import { cache } from "react";
import { db } from "@/lib/db";
import type { StoreSettings } from "@/generated/prisma/client";
import { decryptSettingValue } from "@/lib/secure-settings";

export const SETTINGS_ID = "default";

export const DEFAULT_SETTINGS: Omit<StoreSettings, "updatedAt"> = {
  id: SETTINGS_ID,
  siteName: "Peptides",
  legalEntity: "Peptides Cafe",
  siteUrl: "https://peptides.cafe",
  researchDisclaimer:
    "For laboratory and research use only. Not for human or veterinary consumption. Buyer assumes full responsibility for compliance with local laws.",
  defaultLegalNotice:
    "This product is sold strictly for in-vitro research purposes. It is not a drug, food, or cosmetic.",
  blockedCountries: "US,CA,AU",
  paypalEnabled: false,
  paypalClientId: "",
  paypalClientSecret: "",
  paypalMode: "sandbox",
  cryptoEnabled: false,
  manualPaymentEnabled: true,
  manualPaymentInstructions:
    "We will email wire/ACH details after you place your order. Reference your order ID on payment.",
  manualPaymentEmail: "",
  nowpaymentsApiKey: "",
  nowpaymentsIpnSecret: "",
  resendApiKey: "",
  edgeProtectionEnabled: false,
  edgeProvider: "crowdsec",
  edgeApiKey: "",
  emailFrom: "orders@peptides.cafe",
};

function isMissingStoreSettingsTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as {
    code?: unknown;
    meta?: {
      modelName?: unknown;
    };
  };
  return (
    maybeError.code === "P2021" &&
    (maybeError.meta?.modelName === "StoreSettings" || maybeError.meta?.modelName == null)
  );
}

export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  let row: StoreSettings | null = null;
  try {
    row = await db.storeSettings.findUnique({ where: { id: SETTINGS_ID } });
  } catch (error) {
    // Keep storefront/admin pages functional while DB is being initialized.
    if (!isMissingStoreSettingsTable(error)) throw error;
  }
  if (row) {
    return {
      ...row,
      paypalClientSecret: decryptSettingValue(row.paypalClientSecret),
      nowpaymentsApiKey: decryptSettingValue(row.nowpaymentsApiKey),
      nowpaymentsIpnSecret: decryptSettingValue(row.nowpaymentsIpnSecret),
      resendApiKey: decryptSettingValue(row.resendApiKey),
      edgeApiKey: decryptSettingValue(row.edgeApiKey),
    };
  }
  return { ...DEFAULT_SETTINGS, updatedAt: new Date() };
});

export function parseBlockedCountries(raw: string): string[] {
  return raw
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

export async function isCountryBlocked(countryCode: string): Promise<boolean> {
  const settings = await getStoreSettings();
  return isCountryBlockedInSettings(countryCode, settings);
}

export function isCountryBlockedInSettings(
  countryCode: string,
  settings: Pick<StoreSettings, "blockedCountries">,
): boolean {
  return parseBlockedCountries(settings.blockedCountries).includes(
    countryCode.toUpperCase(),
  );
}

export function isPayPalConfigured(settings: StoreSettings): boolean {
  return (
    settings.paypalEnabled &&
    Boolean(settings.paypalClientId && settings.paypalClientSecret)
  );
}

export function isNowPaymentsConfigured(settings: StoreSettings): boolean {
  return settings.cryptoEnabled && Boolean(settings.nowpaymentsApiKey?.trim());
}

/** @deprecated */
export function isBtcPayConfigured(settings: StoreSettings): boolean {
  return isNowPaymentsConfigured(settings);
}

export function isEmailConfigured(settings: StoreSettings): boolean {
  return Boolean(settings.resendApiKey && settings.emailFrom);
}
