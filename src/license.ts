// Offline-verifiable license keys. Keys are signed with an ECDSA (P-256) private key
// that stays only with the developer (see scripts/generate-license.mjs); this file only
// holds the matching PUBLIC key, so it cannot be used to forge new valid keys.
const PUBLIC_JWK: JsonWebKey = {
  key_ops: ['verify'], ext: true, kty: 'EC',
  x: 'jX_bugFV-IcMCIfc8Pb4no9xR4xZhU0HmwH8K5bp2Ts',
  y: '1lU8FC8LukpF-U9a2m3Z_IXJmpdr1kGkMEEwkbvXpeI',
  crv: 'P-256',
};

export type LicenseTier = 'trial' | '1m' | '6m' | '12m';
export interface LicensePayload { id: string; tier: LicenseTier; issuedAt: string; expiresAt: string; note?: string }
export interface LicenseState { key: string; tier: LicenseTier; expiresAt: string }
export interface LicenseCheckResult { valid: boolean; expired: boolean; payload?: LicensePayload; error?: string }

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 2 ? '==' : s.length % 4 === 3 ? '=' : '';
  const std = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(std);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

let cachedKey: Promise<CryptoKey> | null = null;
function publicKey(): Promise<CryptoKey> {
  if (!cachedKey) cachedKey = crypto.subtle.importKey('jwk', PUBLIC_JWK, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  return cachedKey;
}

export async function verifyLicenseKey(rawKey: string): Promise<LicenseCheckResult> {
  const key = rawKey.trim();
  const parts = key.split('.');
  if (parts.length !== 2) return { valid: false, expired: false, error: 'Malformed license key.' };
  const [payloadB64, sigB64] = parts;
  try {
    const sig = b64urlToBytes(sigB64);
    const pub = await publicKey();
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, sig, new TextEncoder().encode(payloadB64));
    if (!ok) return { valid: false, expired: false, error: 'Invalid license key.' };
    const payload: LicensePayload = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64)));
    const expired = new Date(payload.expiresAt).getTime() < Date.now();
    return { valid: !expired, expired, payload };
  } catch {
    return { valid: false, expired: false, error: 'Invalid license key.' };
  }
}

export function daysRemaining(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}
