/** Single contact inbox for wire / Zelle / direct arrangements. */
export function getDirectPaymentEmail(ordersEmail: string): string {
  const trimmed = ordersEmail.trim();
  return trimmed || "justpeps@proton.me";
}
