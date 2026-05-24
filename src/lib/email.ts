import { Resend } from "resend";
import { getStoreSettings, isEmailConfigured } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";

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

async function disclaimerFooter(): Promise<string> {
  const s = await getStoreSettings();
  return `
    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e5e5" />
    <p style="font-size:12px;color:#666">
      <strong>${escapeHtml(s.siteName)}</strong> — ${escapeHtml(s.legalEntity)}<br />
      ${escapeHtml(s.researchDisclaimer)}
    </p>
  `;
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

function orderLinesTable(summary: OrderEmailSummary): string {
  const rows = summary.lines
    .map(
      (line) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(line.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${line.qty}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(line.unitPriceCents * line.qty)}</td>
      </tr>`,
    )
    .join("");

  const discountRow =
    summary.discountCents > 0
      ? `<tr><td colspan="2" style="padding:8px 0">Discount</td><td style="padding:8px 0;text-align:right">-${formatPrice(summary.discountCents)}</td></tr>`
      : "";

  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      <thead>
        <tr style="text-align:left;color:#666">
          <th style="padding:8px 0;border-bottom:2px solid #ddd">Item</th>
          <th style="padding:8px 0;border-bottom:2px solid #ddd;text-align:center">Qty</th>
          <th style="padding:8px 0;border-bottom:2px solid #ddd;text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="2" style="padding:8px 0">Subtotal</td><td style="padding:8px 0;text-align:right">${formatPrice(summary.subtotalCents)}</td></tr>
        <tr><td colspan="2" style="padding:8px 0">${escapeHtml(summary.shippingLabel ?? "Shipping")}</td><td style="padding:8px 0;text-align:right">${formatPrice(summary.shippingCents)}</td></tr>
        ${discountRow}
        <tr><td colspan="2" style="padding:12px 0;font-weight:600">Total</td><td style="padding:12px 0;text-align:right;font-weight:600">${formatPrice(summary.totalCents)}</td></tr>
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

export async function sendTestEmail(to: string): Promise<void> {
  const settings = await getStoreSettings();
  if (!isEmailConfigured(settings)) {
    throw new Error("Add a Resend API key and from address first.");
  }

  await sendEmail({
    to,
    subject: `${settings.siteName} — test email`,
    html: `
      <h1>Resend is configured</h1>
      <p>This test email was sent from <strong>${escapeHtml(settings.siteName)}</strong>.</p>
      <p>Order confirmation emails will be sent from <strong>${escapeHtml(settings.emailFrom)}</strong>.</p>
      ${await disclaimerFooter()}
    `,
  });
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  paymentUrl: string;
  paymentMethod: string;
  orderUrl: string;
  summary: OrderEmailSummary;
}): Promise<void> {
  const ref = orderRef(params.orderId);
  await sendEmail({
    to: params.to,
    subject: `Order ${ref} confirmed — complete payment`,
    html: `
      <h1>Order confirmed</h1>
      <p>Thanks for your order <strong>#${ref}</strong>.</p>
      <p>Payment method: <strong>${escapeHtml(params.paymentMethod)}</strong></p>
      ${orderLinesTable(params.summary)}
      <p><a href="${params.paymentUrl}" style="display:inline-block;padding:12px 24px;background:#171717;color:#fff;text-decoration:none;border-radius:6px">Complete payment</a></p>
      <p style="font-size:14px;color:#666">You can also <a href="${params.orderUrl}">view your order status</a> anytime.</p>
      ${await disclaimerFooter()}
    `,
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
  await sendEmail({
    to: params.to,
    subject: `Order ${orderRef(params.orderId)} — complete payment`,
    html: `
      <h1>Thank you for your order</h1>
      <p>Your order <strong>#${orderRef(params.orderId)}</strong> is awaiting payment via <strong>${escapeHtml(params.paymentMethod)}</strong>.</p>
      <p>Total: <strong>${params.totalFormatted}</strong></p>
      <p><a href="${params.paymentUrl}" style="display:inline-block;padding:12px 24px;background:#171717;color:#fff;text-decoration:none;border-radius:6px">Complete payment</a></p>
      ${await disclaimerFooter()}
    `,
  });
}

export async function sendPaymentConfirmedEmail(params: {
  to: string;
  orderId: string;
  totalFormatted: string;
  orderUrl: string;
}): Promise<void> {
  await sendEmail({
    to: params.to,
    subject: `Payment received — Order ${orderRef(params.orderId)}`,
    html: `
      <h1>Payment confirmed</h1>
      <p>We received your payment for order <strong>#${orderRef(params.orderId)}</strong>.</p>
      <p>Total paid: <strong>${params.totalFormatted}</strong></p>
      <p><a href="${params.orderUrl}">View order status</a></p>
      ${await disclaimerFooter()}
    `,
  });
}

export async function sendOrderShippedEmail(params: {
  to: string;
  orderId: string;
  trackingNumber?: string | null;
  orderUrl: string;
}): Promise<void> {
  const tracking = params.trackingNumber
    ? `<p>Tracking: <strong>${escapeHtml(params.trackingNumber)}</strong></p>`
    : "";
  await sendEmail({
    to: params.to,
    subject: `Order shipped — ${orderRef(params.orderId)}`,
    html: `
      <h1>Your order has shipped</h1>
      <p>Order <strong>#${orderRef(params.orderId)}</strong> is on its way.</p>
      ${tracking}
      <p><a href="${params.orderUrl}">View order</a></p>
      ${await disclaimerFooter()}
    `,
  });
}
