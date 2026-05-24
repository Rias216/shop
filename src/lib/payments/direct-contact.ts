import type { StoreSettings } from "@/generated/prisma/client";

/** Orders inbox + wire/payments contact for direct arrangements. */
export function getDirectPaymentEmails(
  settings: Pick<StoreSettings, "emailFrom" | "manualPaymentEmail">,
): [string, string] {
  const ordersEmail = settings.emailFrom.trim() || "orders@peptides.cafe";
  const wireEmail = settings.manualPaymentEmail.trim();
  if (wireEmail) {
    return [ordersEmail, wireEmail];
  }

  const at = ordersEmail.indexOf("@");
  if (at > 0) {
    const domain = ordersEmail.slice(at + 1);
    return [ordersEmail, `payments@${domain}`];
  }
  return [ordersEmail, "payments@peptides.cafe"];
}

export function getWirePaymentEmail(
  settings: Pick<StoreSettings, "emailFrom" | "manualPaymentEmail">,
): string {
  return getDirectPaymentEmails(settings)[1];
}
