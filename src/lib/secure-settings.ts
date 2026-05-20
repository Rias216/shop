import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ENC_PREFIX = "enc:v1:";
const IV_LEN = 12;
const TAG_LEN = 16;
const ALGO = "aes-256-gcm";

function getKey(): Buffer | null {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  return createHash("sha256").update(raw, "utf8").digest();
}

function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}

export function encryptSettingValue(value: string): string {
  if (!value) return value;
  if (isEncrypted(value)) return value;
  const key = getKey();
  if (!key) return value;

  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64");
  return `${ENC_PREFIX}${payload}`;
}

export function decryptSettingValue(value: string): string {
  if (!value || !isEncrypted(value)) return value;
  const key = getKey();
  if (!key) return value;

  const payload = value.slice(ENC_PREFIX.length);
  const raw = Buffer.from(payload, "base64");
  if (raw.length <= IV_LEN + TAG_LEN) return value;
  const iv = raw.subarray(0, IV_LEN);
  const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const encrypted = raw.subarray(IV_LEN + TAG_LEN);

  try {
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return value;
  }
}

export function isEncryptedSettingValue(value: string): boolean {
  return isEncrypted(value);
}
