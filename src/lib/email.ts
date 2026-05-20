import { Resend } from "resend";
import { getStoreSettings, isEmailConfigured } from "@/lib/settings";

async function disclaimerFooter(): Promise<string> {
  const s = await getStoreSettings();
  return `
    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e5e5" />
    <p style="font-size:12px;color:#666">
      <strong>${s.siteName}</strong> — ${s.legalEntity}<br />
      ${s.researchDisclaimer}
    </p>
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
  await resend.emails.send({
    from: settings.emailFrom,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export async function sendOrderAwaitingPaymentEmail(params: {
  to: string;
  orderId: string;
  totalFormatted: string;
  paymentUrl: string;
  paymentMethod: string;
}): Promise<void> {
  await sendEmail({
    to: params.to,
    subject: `Order ${params.orderId.slice(-8).toUpperCase()} — complete payment`,
    html: `
      <h1>Thank you for your order</h1>
      <p>Your order <strong>#${params.orderId.slice(-8).toUpperCase()}</strong> is awaiting payment via <strong>${params.paymentMethod}</strong>.</p>
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
    subject: `Payment received — Order ${params.orderId.slice(-8).toUpperCase()}`,
    html: `
      <h1>Payment confirmed</h1>
      <p>We received your payment for order <strong>#${params.orderId.slice(-8).toUpperCase()}</strong>.</p>
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
    ? `<p>Tracking: <strong>${params.trackingNumber}</strong></p>`
    : "";
  await sendEmail({
    to: params.to,
    subject: `Order shipped — ${params.orderId.slice(-8).toUpperCase()}`,
    html: `
      <h1>Your order has shipped</h1>
      <p>Order <strong>#${params.orderId.slice(-8).toUpperCase()}</strong> is on its way.</p>
      ${tracking}
      <p><a href="${params.orderUrl}">View order</a></p>
      ${await disclaimerFooter()}
    `,
  });
}
