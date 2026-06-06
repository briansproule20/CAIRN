/**
 * Stateless session token: base64url(payload).base64url(HMAC-SHA256).
 * Signed/verified with Web Crypto so it works in BOTH Node route handlers and
 * the Edge middleware — no DB lookup needed to authenticate a request.
 */

const ENC = new TextEncoder();
const DEC = new TextDecoder();

export const SESSION_COOKIE = "cairn_session";
const DEFAULT_TTL = 60 * 60 * 24 * 30; // 30 days

export interface Session {
  userId: string;
  exp: number;
}

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(norm);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.CAIRN_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("CAIRN_SECRET is not set (or too short).");
  }
  return crypto.subtle.importKey(
    "raw",
    ENC.encode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(
  userId: string,
  ttlSeconds = DEFAULT_TTL
): Promise<string> {
  const payload: Session = {
    userId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = b64url(ENC.encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, ENC.encode(body) as BufferSource)
  );
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(
  token: string | undefined | null
): Promise<Session | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const key = await hmacKey();
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      fromB64url(sig) as BufferSource,
      ENC.encode(body) as BufferSource
    );
    if (!ok) return null;
    const payload = JSON.parse(DEC.decode(fromB64url(body))) as Session;
    if (typeof payload.userId !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = DEFAULT_TTL;
