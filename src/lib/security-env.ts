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

const WEAK_ADMIN_PASSWORD_VALUES = new Set([
  "",
  "admin123",
  "password",
  "changeme",
]);

function isWeakSecret(value: string | undefined): boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  if (WEAK_SECRET_VALUES.has(normalized)) return true;
  return normalized.length < 32;
}

export function isWeakAdminPassword(value: string | undefined): boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  if (WEAK_ADMIN_PASSWORD_VALUES.has(normalized)) return true;
  return normalized.length < 12;
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

  if (isWeakAdminPassword(process.env.ADMIN_PASSWORD)) {
    throw new Error(
      "Insecure ADMIN_PASSWORD in production. Set a strong password (>=12 chars, not default).",
    );
  }
}
