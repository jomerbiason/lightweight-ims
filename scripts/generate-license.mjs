// Local-only license key generator. Run this on your own machine, never deploy it.
// Usage: node scripts/generate-license.mjs <trial|1m|6m|12m> [note]
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';

const { subtle } = webcrypto;
const TIERS = {
  trial: 7 * 24 * 60 * 60 * 1000,
  '1m': 30 * 24 * 60 * 60 * 1000,
  '6m': 183 * 24 * 60 * 60 * 1000,
  '12m': 366 * 24 * 60 * 60 * 1000,
};

const tier = process.argv[2];
const note = process.argv[3] || '';
if (!TIERS[tier]) {
  console.error('Usage: node scripts/generate-license.mjs <trial|1m|6m|12m> [note]');
  process.exit(1);
}

const privJwk = JSON.parse(readFileSync(new URL('../license-private.local.json', import.meta.url)));
const privateKey = await subtle.importKey('jwk', privJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);

const now = Date.now();
const payload = {
  id: crypto.randomUUID().slice(0, 8),
  tier,
  issuedAt: new Date(now).toISOString(),
  expiresAt: new Date(now + TIERS[tier]).toISOString(),
  ...(note ? { note } : {}),
};

const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
const signature = await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, Buffer.from(payloadB64));
const sigB64 = Buffer.from(signature).toString('base64url');

const key = `${payloadB64}.${sigB64}`;
console.log('License key:');
console.log(key);
console.log('');
console.log('Details:', payload);
