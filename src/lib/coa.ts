export type CoaSummary = {
  fileUrl: string;
  batchCode: string;
};

export function getLatestCoa<T extends { issuedAt: Date }>(
  documents: T[],
): T | undefined {
  if (documents.length === 0) return undefined;
  return [...documents].sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())[0];
}

export function formatPurityLabel(purity: string): string {
  const trimmed = purity.trim();
  if (/^purity\s/i.test(trimmed)) return trimmed;
  return trimmed.startsWith("≥") || trimmed.startsWith(">")
    ? trimmed
    : `Purity ${trimmed}`;
}
