import { Resend } from "resend";
import { getStoreSettings, isEmailConfigured } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";

export type EmailTheme = "light" | "dark";

export type OrderEmailLine = {
  name: string;
  qty: number;
  unitPriceCents: number;
};

export type OrderEmailSummary = {
  orderId: string;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  shippingLabel?: string;
  lines: OrderEmailLine[];
};

const EMAIL_PALETTE = {
  light: {
    pageBg: "#f4f6fb",
    pageWash:
      "radial-gradient(ellipse 80% 50% at 10% 0%, rgba(240,168,212,0.35), transparent 60%), radial-gradient(ellipse 70% 45% at 90% 5%, rgba(255,176,122,0.28), transparent 55%), linear-gradient(180deg, #fdf8fc 0%, #f4f6fb 100%)",
    cardBg: "rgba(255,255,255,0.92)",
    cardBorder: "rgba(15, 23, 42, 0.1)",
    foreground: "#0f172a",
    muted: "#475569",
    accent: "#6b8fd4",
    accentSoft: "#b088a8",
    price: "#15803d",
    divider: "rgba(15, 23, 42, 0.08)",
    buttonText: "#ffffff",
    link: "#6b8fd4",
  },
  dark: {
    pageBg: "#0f1419",
    pageWash:
      "radial-gradient(ellipse 80% 50% at 10% 0%, rgba(232,142,196,0.18), transparent 60%), radial-gradient(ellipse 70% 45% at 90% 5%, rgba(245,154,92,0.14), transparent 55%), linear-gradient(180deg, #121820 0%, #0f1419 100%)",
    cardBg: "rgba(28, 38, 54, 0.92)",
    cardBorder: "rgba(148, 163, 184, 0.18)",
    foreground: "#e2e8f0",
    muted: "#94a3b8",
    accent: "#a8bde8",
    accentSoft: "#d4b0d8",
    price: "#4ade80",
    divider: "rgba(148, 163, 184, 0.14)",
    buttonText: "#0f172a",
    link: "#a8bde8",
  },
} as const;

function paletteFor(theme: EmailTheme) {
  return EMAIL_PALETTE[theme];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function orderRef(orderId: string): string {
  return orderId.slice(-8).toUpperCase();
}

function formatFromAddress(siteName: string, emailFrom: string): string {
  const trimmed = emailFrom.trim();
  if (trimmed.includes("<")) return trimmed;
  return `${siteName} <${trimmed}>`;
}

function brandHeader(siteName: string, theme: EmailTheme): string {
  const p = paletteFor(theme);
  const [first, ...rest] = siteName.trim().split(/\s+/);
  const lead = first || siteName;
  const tail = rest.join(" ");
  const wordmark = tail
    ? `<span style="color:${p.foreground}">${escapeHtml(lead)}</span> <span style="color:${p.accent}">${escapeHtml(tail)}</span>`
    : `<span style="color:${p.foreground}">${escapeHtml(siteName)}</span>`;

  return `
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${p.accent}">
      Research supply
    </p>
    <p style="margin:0 0 20px;font-size:20px;font-weight:600;letter-spacing:-0.02em;line-height:1.2">
      ${wordmark}
    </p>
  `;
}

function emailButton(href: string, label: string, theme: EmailTheme): string {
  const p = paletteFor(theme);
  return `<a href="${href}" style="display:inline-block;margin:20px 0 8px;padding:12px 24px;background:${p.accent};color:${p.buttonText};text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">${escapeHtml(label)}</a>`;
}

function emailLink(href: string, label: string, theme: EmailTheme): string {
  const p = paletteFor(theme);
  return `<a href="${href}" style="color:${p.link};text-decoration:none;font-weight:500">${escapeHtml(label)}</a>`;
}

async function wrapEmailContent(params: {
  title: string;
  body: string;
  theme?: EmailTheme;
}): Promise<string> {
  const settings = await getStoreSettings();
  const theme = params.theme ?? "light";
  const p = paletteFor(theme);

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:${p.pageBg};font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${p.foreground};line-height:1.55;-webkit-font-smoothing:antialiased">
    <div style="padding:32px 16px;background:${p.pageWash}">
      <div style="max-width:560px;margin:0 auto;padding:28px 24px;background:${p.cardBg};border:1px solid ${p.cardBorder};border-radius:8px;box-shadow:0 4px 18px rgba(99,130,180,0.08)">
        ${brandHeader(settings.siteName, theme)}
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:${p.foreground}">${escapeHtml(params.title)}</h1>
        <div style="font-size:15px;color:${p.foreground}">${params.body}</div>
        ${await disclaimerFooter(theme)}
      </div>
    </div>
  </body>
</html>`;
}

async function disclaimerFooter(theme: EmailTheme): Promise<string> {
  const s = await getStoreSettings();
  const p = paletteFor(theme);
  return `
    <hr style="margin:28px 0 20px;border:none;border-top:1px solid ${p.divider}" />
    <p style="margin:0;font-size:12px;line-height:1.6;color:${p.muted}">
      <strong style="color:${p.foreground}">${escapeHtml(s.siteName)}</strong> — ${escapeHtml(s.legalEntity)}<br />
      ${escapeHtml(s.researchDisclaimer)}
    </p>
  `;
}

function orderLinesTable(summary: OrderEmailSummary, theme: EmailTheme): string {
  const p = paletteFor(theme);
  const rows = summary.lines
    .map(
      (line) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${p.divider};color:${p.foreground}">${escapeHtml(line.name)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${p.divider};text-align:center;color:${p.muted}">${line.qty}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${p.divider};text-align:right;color:${p.foreground}">${formatPrice(line.unitPriceCents * line.qty)}</td>
      </tr>`,
    )
    .join("");

  const discountRow =
    summary.discountCents > 0
      ? `<tr><td colspan="2" style="padding:8px 0;color:${p.muted}">Discount</td><td style="padding:8px 0;text-align:right;color:${p.price}">-${formatPrice(summary.discountCents)}</td></tr>`
      : "";

  return `
    <table style="width:100%;border-collapse:collapse;margin:18px 0 8px;font-size:14px">
      <thead>
        <tr style="text-align:left;color:${p.muted}">
          <th style="padding:8px 0;border-bottom:2px solid ${p.divider}">Item</th>
          <th style="padding:8px 0;border-bottom:2px solid ${p.divider};text-align:center">Qty</th>
          <th style="padding:8px 0;border-bottom:2px solid ${p.divider};text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="2" style="padding:8px 0;color:${p.muted}">Subtotal</td><td style="padding:8px 0;text-align:right;color:${p.foreground}">${formatPrice(summary.subtotalCents)}</td></tr>
        <tr><td colspan="2" style="padding:8px 0;color:${p.muted}">${escapeHtml(summary.shippingLabel ?? "Shipping")}</td><td style="padding:8px 0;text-align:right;color:${p.foreground}">${formatPrice(summary.shippingCents)}</td></tr>
        ${discountRow}
        <tr><td colspan="2" style="padding:12px 0;font-weight:600;color:${p.foreground}">Total</td><td style="padding:12px 0;text-align:right;font-weight:600;color:${p.price}">${formatPrice(summary.totalCents)}</td></tr>
      </tfoot>
    </table>
  `;
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const settings = await getStoreSettings();

  if (!isEmailConfigured(settings)) {
    console.log("[email:dev]", params.subject, "→", params.to);
    return;
  }

  const resend = new Resend(settings.resendApiKey);
  const { error } = await resend.emails.send({
    from: formatFromAddress(settings.siteName, settings.emailFrom),
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendTestEmail(to: string, theme: EmailTheme = "light"): Promise<void> {
  const settings = await getStoreSettings();
  if (!isEmailConfigured(settings)) {
    throw new Error("Add a Resend API key and from address first.");
  }

  const p = paletteFor(theme);
  await sendEmail({
    to,
    subject: `${settings.siteName} — test email`,
    html: await wrapEmailContent({
      theme,
      title: "Resend is configured",
      body: `
        <p style="margin:0 0 12px;color:${p.muted}">This test email was sent from <strong style="color:${p.foreground}">${escapeHtml(settings.siteName)}</strong>.</p>
        <p style="margin:0;color:${p.muted}">Order emails will be sent from <strong style="color:${p.foreground}">${escapeHtml(settings.emailFrom)}</strong>.</p>
      `,
    }),
  });
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  paymentUrl: string;
  paymentMethod: string;
  orderUrl: string;
  summary: OrderEmailSummary;
  theme?: EmailTheme;
}): Promise<void> {
  const theme = params.theme ?? "light";
  const p = paletteFor(theme);
  const ref = orderRef(params.orderId);

  await sendEmail({
    to: params.to,
    subject: `Order ${ref} confirmed — complete payment`,
    html: await wrapEmailContent({
      theme,
      title: "Order confirmed",
      body: `
        <p style="margin:0 0 12px;color:${p.muted}">Thanks for your order <strong style="color:${p.foreground}">#${ref}</strong>.</p>
        <p style="margin:0 0 4px;color:${p.muted}">Payment method: <strong style="color:${p.foreground}">${escapeHtml(params.paymentMethod)}</strong></p>
        ${orderLinesTable(params.summary, theme)}
        ${emailButton(params.paymentUrl, "Complete payment", theme)}
        <p style="margin:8px 0 0;font-size:14px;color:${p.muted}">You can also ${emailLink(params.orderUrl, "view your order status", theme)} anytime.</p>
      `,
    }),
  });
}

/** @deprecated use sendOrderConfirmationEmail */
export async function sendOrderAwaitingPaymentEmail(params: {
  to: string;
  orderId: string;
  totalFormatted: string;
  paymentUrl: string;
  paymentMethod: string;
}): Promise<void> {
  const theme: EmailTheme = "light";
  const p = paletteFor(theme);
  const ref = orderRef(params.orderId);

  await sendEmail({
    to: params.to,
    subject: `Order ${ref} — complete payment`,
    html: await wrapEmailContent({
      theme,
      title: "Thank you for your order",
      body: `
        <p style="margin:0 0 12px;color:${p.muted}">Your order <strong style="color:${p.foreground}">#${ref}</strong> is awaiting payment via <strong style="color:${p.foreground}">${escapeHtml(params.paymentMethod)}</strong>.</p>
        <p style="margin:0 0 16px;color:${p.foreground}">Total: <strong style="color:${p.price}">${params.totalFormatted}</strong></p>
        ${emailButton(params.paymentUrl, "Complete payment", theme)}
      `,
    }),
  });
}

export async function sendPaymentConfirmedEmail(params: {
  to: string;
  orderId: string;
  totalFormatted: string;
  orderUrl: string;
  theme?: EmailTheme;
}): Promise<void> {
  const theme = params.theme ?? "light";
  const p = paletteFor(theme);
  const ref = orderRef(params.orderId);

  await sendEmail({
    to: params.to,
    subject: `Payment received — Order ${ref}`,
    html: await wrapEmailContent({
      theme,
      title: "Payment confirmed",
      body: `
        <p style="margin:0 0 12px;color:${p.muted}">We received your payment for order <strong style="color:${p.foreground}">#${ref}</strong>.</p>
        <p style="margin:0 0 16px;color:${p.foreground}">Total paid: <strong style="color:${p.price}">${params.totalFormatted}</strong></p>
        <p style="margin:0">${emailLink(params.orderUrl, "View order status", theme)}</p>
      `,
    }),
  });
}

export async function sendOrderShippedEmail(params: {
  to: string;
  orderId: string;
  trackingNumber?: string | null;
  orderUrl: string;
  theme?: EmailTheme;
}): Promise<void> {
  const theme = params.theme ?? "light";
  const p = paletteFor(theme);
  const ref = orderRef(params.orderId);
  const tracking = params.trackingNumber
    ? `<p style="margin:0 0 12px;color:${p.muted}">Tracking: <strong style="color:${p.foreground}">${escapeHtml(params.trackingNumber)}</strong></p>`
    : "";

  await sendEmail({
    to: params.to,
    subject: `Order shipped — ${ref}`,
    html: await wrapEmailContent({
      theme,
      title: "Your order has shipped",
      body: `
        <p style="margin:0 0 12px;color:${p.muted}">Order <strong style="color:${p.foreground}">#${ref}</strong> is on its way.</p>
        ${tracking}
        <p style="margin:0">${emailLink(params.orderUrl, "View order", theme)}</p>
      `,
    }),
  });
}

export function resolveEmailTheme(value: string | null | undefined): EmailTheme {
  return value === "dark" ? "dark" : "light";
}
