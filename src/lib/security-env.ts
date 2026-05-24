import "server-only";

const WEAK_SECRET_VALUES = new Set([
  "",
  "dev-secret-change-in-production",
  "change-me",
  "changeme",
  "test",
  "secret",
  "password",
]);

function isWeakSecret(value: string | undefined): boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  if (WEAK_SECRET_VALUES.has(normalized)) return true;
  return normalized.length < 32;
}

let validated = false;

export function enforceSecurityEnv(): void {
  if (validated) return;
  validated = true;

  if (process.env.NODE_ENV !== "production") return;
  // Allow local/staging builds to complete; enforce at runtime in start/dev.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (isWeakSecret(authSecret)) {
    throw new Error(
      "Insecure AUTH_SECRET/NEXTAUTH_SECRET in production. Use a strong random secret (>=32 chars).",
    );
  }
}
