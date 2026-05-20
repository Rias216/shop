import { getStoreSettings, isPayPalConfigured } from "@/lib/settings";
import type { StoreSettings } from "@/generated/prisma/client";

function apiBase(mode: string): string {
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(settings: StoreSettings): Promise<string> {
  if (!isPayPalConfigured(settings)) {
    throw new Error("PayPal is not configured. Enable it in Admin → Settings.");
  }

  const auth = Buffer.from(
    `${settings.paypalClientId}:${settings.paypalClientSecret}`,
  ).toString("base64");
  const res = await fetch(`${apiBase(settings.paypalMode)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function createPayPalOrder(params: {
  orderId: string;
  totalCents: number;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ paypalOrderId: string; approvalUrl: string }> {
  const settings = await getStoreSettings();
  const token = await getAccessToken(settings);
  const total = (params.totalCents / 100).toFixed(2);

  const res = await fetch(`${apiBase(settings.paypalMode)}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.orderId,
          amount: { currency_code: "USD", value: total },
          description: `Order ${params.orderId}`,
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        user_action: "PAY_NOW",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create order failed: ${err}`);
  }

  const data = (await res.json()) as {
    id: string;
    links: { rel: string; href: string }[];
  };

  const approval = data.links.find((l) => l.rel === "approve");
  if (!approval) throw new Error("PayPal approval URL not found");

  return { paypalOrderId: data.id, approvalUrl: approval.href };
}

export async function capturePayPalOrder(
  paypalOrderId: string,
): Promise<{
  success: boolean;
  status: string;
  captureId: string | null;
  amountValue: string | null;
  amountCurrency: string | null;
}> {
  const settings = await getStoreSettings();
  const token = await getAccessToken(settings);

  const res = await fetch(
    `${apiBase(settings.paypalMode)}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal capture failed: ${err}`);
  }

  const data = (await res.json()) as {
    status: string;
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{
          id?: string;
          amount?: { value?: string; currency_code?: string };
          status?: string;
        }>;
      };
    }>;
  };

  const captures = data.purchase_units?.flatMap((u) => u.payments?.captures ?? []) ?? [];
  const completedCapture = captures.find((c) => c.status === "COMPLETED") ?? captures[0] ?? null;

  return {
    success: data.status === "COMPLETED",
    status: data.status,
    captureId: completedCapture?.id ?? null,
    amountValue: completedCapture?.amount?.value ?? null,
    amountCurrency: completedCapture?.amount?.currency_code ?? null,
  };
}
