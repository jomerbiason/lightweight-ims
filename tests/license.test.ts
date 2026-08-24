import { describe, it, expect } from 'vitest';
import { verifyLicenseKey } from '../src/license';

// Fixed test fixtures signed with the (repo-external) private key. Safe to commit --
// a signature cannot be used to derive the private key or forge new keys.
const VALID_LONG_KEY = 'eyJpZCI6InRlc3QtZml4dHVyZSIsInRpZXIiOiIxMm0iLCJpc3N1ZWRBdCI6IjIwMjYtMDEtMDFUMDA6MDA6MDAuMDAwWiIsImV4cGlyZXNBdCI6IjIxMjYtMDEtMDFUMDA6MDA6MDAuMDAwWiJ9.Dsvevf9bDeRw_y2lDMF9WZXcywTBYZfzSyu8V1r0tno6kfXicZN4ZeSW3MP2cU6LQ-ecDda_5Ky6ph6jYnhZ5g';
const EXPIRED_KEY = 'eyJpZCI6ImV4cGlyZWQtZml4dHVyZSIsInRpZXIiOiJ0cmlhbCIsImlzc3VlZEF0IjoiMjAyMC0wMS0wMVQwMDowMDowMC4wMDBaIiwiZXhwaXJlc0F0IjoiMjAyMC0wMS0wOFQwMDowMDowMC4wMDBaIn0.Ljq7R-W6Nyvb_vpOPSNDPfd5q_SrnhILfAi5UNPNyJ15VWtixKY8vBfSR74KpHkD7zqznlMCwf2hJgGlYah_1Q';

describe('license verification', () => {
  it('accepts a validly signed, unexpired key', async () => {
    const r = await verifyLicenseKey(VALID_LONG_KEY);
    expect(r.valid).toBe(true);
    expect(r.expired).toBe(false);
    expect(r.payload?.tier).toBe('12m');
  });

  it('rejects an expired key even with a valid signature', async () => {
    const r = await verifyLicenseKey(EXPIRED_KEY);
    expect(r.valid).toBe(false);
    expect(r.expired).toBe(true);
    expect(r.payload?.tier).toBe('trial');
  });

  it('rejects a tampered payload', async () => {
    const [payload, sig] = VALID_LONG_KEY.split('.');
    const flipped = payload[0] === 'e' ? 'f' + payload.slice(1) : 'e' + payload.slice(1);
    const r = await verifyLicenseKey(flipped + '.' + sig);
    expect(r.valid).toBe(false);
  });

  it('rejects a malformed key', async () => {
    const r = await verifyLicenseKey('not-a-real-key');
    expect(r.valid).toBe(false);
    expect(r.error).toBeDefined();
  });

  it('rejects an empty key', async () => {
    const r = await verifyLicenseKey('');
    expect(r.valid).toBe(false);
  });
});
