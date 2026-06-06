import {
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
} from "crypto";

/**
 * Auth crypto — no external deps, all Node builtins.
 *  - Passwords: scrypt with a per-user random salt (salt embedded in the hash).
 *  - Secrets (the BYO Poncho key): AES-256-GCM, key derived from CAIRN_SECRET.
 *
 * Set CAIRN_SECRET in the environment (e.g. `openssl rand -base64 32`).
 * Used only in Node-runtime route handlers, never the edge.
 */

function secret(): string {
  const s = process.env.CAIRN_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "CAIRN_SECRET is not set (or too short). Add a 32+ char secret to .env.local."
    );
  }
  return s;
}

// --- Passwords -------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = scryptSync(password, Buffer.from(saltB64, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// --- Secret encryption (BYO Poncho key) ------------------------------------

function encKey(): Buffer {
  return scryptSync(secret(), "cairn-enc-v1", 32);
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `gcm$${iv.toString("base64")}$${tag.toString("base64")}$${enc.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  const [scheme, ivB64, tagB64, dataB64] = payload.split("$");
  if (scheme !== "gcm" || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed ciphertext.");
  }
  const decipher = createDecipheriv("aes-256-gcm", encKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
