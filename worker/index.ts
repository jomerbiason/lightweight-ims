// Cloudflare Worker: serves the built static app AND a small barcode-scan relay API
// used for pairing two devices (e.g. a phone as scanner, a tablet as the main display)
// under a shared 6-digit Sync Code. No store data is ever sent here -- only the
// scanned barcode text, briefly (60s TTL, deleted after being read once).

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  SYNC_KV: KVNamespace;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

const CODE_RE = /^[0-9]{6}$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/sync/')) {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

      const parts = url.pathname.split('/').filter(Boolean); // ["api","sync",code,action]
      const code = parts[2];
      const action = parts[3];
      if (!code || !CODE_RE.test(code)) return json({ error: 'Invalid sync code.' }, 400);
      const scanKey = `scan:${code}`;
      const roomKey = `room:${code}`;
      const ackKey = `ack:${code}`;
      const controlKey = `control:${code}`;

      if (action === 'scan' && request.method === 'POST') {
        let body: any;
        try { body = await request.json(); } catch { return json({ error: 'Invalid body.' }, 400); }
        const barcode = String(body?.barcode || '').slice(0, 128);
        if (!barcode) return json({ error: 'Missing barcode.' }, 400);
        await env.SYNC_KV.put(scanKey, JSON.stringify({ barcode, at: Date.now() }), { expirationTtl: 60 });
        await env.SYNC_KV.put(roomKey, String(Date.now()), { expirationTtl: 6 * 60 * 60 });
        return json({ ok: true });
      }

      if (action === 'scan' && request.method === 'GET') {
        const raw = await env.SYNC_KV.get(scanKey);
        if (!raw) return json({ scan: null });
        await env.SYNC_KV.delete(scanKey);
        return json({ scan: JSON.parse(raw) });
      }

      if (action === 'ping' && request.method === 'POST') {
        await env.SYNC_KV.put(roomKey, String(Date.now()), { expirationTtl: 6 * 60 * 60 });
        return json({ ok: true });
      }

      if (action === 'room' && request.method === 'GET') {
        const raw = await env.SYNC_KV.get(roomKey);
        return json({ exists: Boolean(raw) });
      }

      // "ack" carries the IMS device's response to a scan/undo/checkout back to the scanner
      // device (item found, price, running total, or the final receipt after checkout).
      if (action === 'ack' && request.method === 'POST') {
        let body: any;
        try { body = await request.json(); } catch { return json({ error: 'Invalid body.' }, 400); }
        const text = JSON.stringify(body);
        if (text.length > 8000) return json({ error: 'Payload too large.' }, 400);
        await env.SYNC_KV.put(ackKey, text, { expirationTtl: 60 });
        return json({ ok: true });
      }

      if (action === 'ack' && request.method === 'GET') {
        const raw = await env.SYNC_KV.get(ackKey);
        if (!raw) return json({ ack: null });
        await env.SYNC_KV.delete(ackKey);
        return json({ ack: JSON.parse(raw) });
      }

      // "control" carries a command from the scanner device to the IMS device (undo the
      // last scanned item, or finish/checkout the scanning session).
      if (action === 'control' && request.method === 'POST') {
        let body: any;
        try { body = await request.json(); } catch { return json({ error: 'Invalid body.' }, 400); }
        const act = String(body?.action || '');
        if (act !== 'undo' && act !== 'checkout') return json({ error: 'Invalid action.' }, 400);
        await env.SYNC_KV.put(controlKey, JSON.stringify({ action: act }), { expirationTtl: 60 });
        return json({ ok: true });
      }

      if (action === 'control' && request.method === 'GET') {
        const raw = await env.SYNC_KV.get(controlKey);
        if (!raw) return json({ control: null });
        await env.SYNC_KV.delete(controlKey);
        return json({ control: JSON.parse(raw) });
      }

      return json({ error: 'Not found.' }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
