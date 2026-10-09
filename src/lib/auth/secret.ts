// Shared by jwt.ts and proxy.ts (which must not import next/headers).
const FALLBACK_DEV_SECRET = "super-secret-jwt-key-schoolfit-app-2026-secure-random-32chars";

let cachedKey: Uint8Array | null = null;

// Resolved lazily so `next build` doesn't need the secret; any real request in production without it fails loudly.
export function getSessionSecretKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  }
  cachedKey = new TextEncoder().encode(secret || FALLBACK_DEV_SECRET);
  return cachedKey;
}

export const COOKIE_NAME = "schoolfit_session";
