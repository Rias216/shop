/** Companion inbox for wire / Zelle / direct arrangements. */
export function getDirectPaymentEmails(ordersEmail: string): [string, string] {
  const trimmed = ordersEmail.trim();
  const at = trimmed.indexOf("@");
  if (at > 0) {
    const domain = trimmed.slice(at + 1);
    return [trimmed, `payments@${domain}`];
  }
  return [trimmed || "orders@peptides.cafe", "payments@peptides.cafe"];
}
