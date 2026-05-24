import { Resend } from "resend";
import {
  orderRef,
  renderEmailButton,
  renderEmailLayout,
  renderInfoBadge,
  renderMutedLink,
  renderOrderLinesTable,
  type EmailTheme,
  type OrderEmailSummary,
} from "@/lib/email-template";
import { getStoreSettings, isEmailConfigured } from "@/lib/settings";

export type { EmailTheme, OrderEmailLine, OrderEmailSummary } from "@/lib/email-template";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatFromAddress(siteName: string, emailFrom: string): string {
  const trimmed = emailFrom.trim();
  if (trimmed.includes("<")) return trimmed;
  return `${siteName} <${trimmed}>`;
}

async function disclaimerFooterHtml(theme: EmailTheme): Promise<string> {
  const s = await getStoreSettings();
  return `
    <strong>${escapeHtml(s.siteName)}</strong> — ${escapeHtml(s.legalEntity)}<br />
    ${escapeHtml(s.researchDisclaimer)}
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

async function composeEmail(params: {
  theme?: EmailTheme;
  eyebrow?: string;
  title: string;
  bodyHtml: string;
}): Promise<string> {
  const settings = await getStoreSettings();
  const theme = params.theme ?? "light";
  return renderEmailLayout({
    theme,
    siteName: settings.siteName,
    eyebrow: params.eyebrow,
    title: params.title,
    bodyHtml: params.bodyHtml,
    footerHtml: await disclaimerFooterHtml(theme),
  });
}

export async function sendTestEmail(to: string, theme: EmailTheme = "light"): Promise<void> {
  const settings = await getStoreSettings();
  if (!isEmailConfigured(settings)) {
    throw new Error("Add a Resend API key and from address first.");
  }

  await sendEmail({
    to,
    subject: `${settings.siteName} — test email`,
    html: await composeEmail({
      theme,
      eyebrow: "Test",
      title: "Resend is configured",
      bodyHtml: `
        <p style="margin:0 0 12px">This test email was sent from <strong>${escapeHtml(settings.siteName)}</strong>.</p>
        <p style="margin:0">Order emails will be sent from <strong>${escapeHtml(settings.emailFrom)}</strong>.</p>
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
  wireContactEmail?: string;
}): Promise<void> {
  const theme = params.theme ?? "light";
  const ref = orderRef(params.orderId);
  const wireBlock =
    params.wireContactEmail && /wire|bank|manual|transfer|ach|zelle/i.test(params.paymentMethod)
      ? `<p style="margin:16px 0 0">For wire or bank transfer, contact us at ${renderMutedLink(`mailto:${params.wireContactEmail}`, params.wireContactEmail, theme)} and include order <strong>#${ref}</strong>.</p>`
      : "";

  const bodyHtml = `
    <p style="margin:0 0 12px">Thanks for your order. Your reference is <strong>#${ref}</strong>.</p>
    <p style="margin:0 0 8px">${renderInfoBadge(params.paymentMethod, theme)}</p>
    ${renderOrderLinesTable(params.summary, theme)}
    ${renderEmailButton({ href: params.paymentUrl, label: "Complete payment", theme })}
    <p style="margin:12px 0 0;font-size:14px">You can also ${renderMutedLink(params.orderUrl, "view your order status", theme)} anytime.</p>
    ${wireBlock}
  `;

  await sendEmail({
    to: params.to,
    subject: `Order ${ref} confirmed — complete payment`,
    html: await composeEmail({
      theme,
      eyebrow: "Order confirmed",
      title: "Thanks for your order",
      bodyHtml,
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
  const ref = orderRef(params.orderId);

  await sendEmail({
    to: params.to,
    subject: `Payment received — Order ${ref}`,
    html: await composeEmail({
      theme,
      eyebrow: "Payment received",
      title: "Payment confirmed",
      bodyHtml: `
        <p style="margin:0 0 12px">We received your payment for order <strong>#${ref}</strong>.</p>
        <p style="margin:0 0 20px">Total paid: <strong>${escapeHtml(params.totalFormatted)}</strong></p>
        ${renderEmailButton({ href: params.orderUrl, label: "View order status", theme })}
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
  const ref = orderRef(params.orderId);
  const tracking = params.trackingNumber
    ? `<p style="margin:0 0 12px">Tracking: <strong>${escapeHtml(params.trackingNumber)}</strong></p>`
    : "";

  await sendEmail({
    to: params.to,
    subject: `Order shipped — ${ref}`,
    html: await composeEmail({
      theme,
      eyebrow: "Shipping update",
      title: "Your order is on the way",
      bodyHtml: `
        <p style="margin:0 0 12px">Order <strong>#${ref}</strong> has shipped.</p>
        ${tracking}
        ${renderEmailButton({ href: params.orderUrl, label: "View order", theme })}
      `,
    }),
  });
}
