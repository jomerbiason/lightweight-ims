// Client for the barcode-scan relay in worker/index.ts. Same-origin only (the Worker
// serves both the app and this API), so no base URL configuration is needed.
// cache:'no-store' guards against a stale/pre-fix service worker still controlling the
// page -- these endpoints must always hit the network, never a cached response.
export function generateSyncCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function pushScan(code: string, barcode: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${code}/scan`, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ barcode }) });
    return res.ok;
  } catch { return false; }
}

export async function pollScan(code: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/sync/${code}/scan`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data: any = await res.json();
    return data?.scan?.barcode ?? null;
  } catch { return null; }
}

export async function pingRoom(code: string): Promise<void> {
  try { await fetch(`/api/sync/${code}/ping`, { method: 'POST', cache: 'no-store' }); } catch {}
}

export async function checkRoom(code: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${code}/room`, { cache: 'no-store' });
    if (!res.ok) return false;
    const data: any = await res.json();
    return Boolean(data?.exists);
  } catch { return false; }
}

// Result of a scan / undo / checkout, sent by the IMS device back to the scanner device.
export interface SyncAck {
  ok: boolean;
  type?: 'scanned' | 'undo' | 'checkout';
  barcode?: string;
  name?: string;
  price?: number;
  qty?: number;
  cartTotal?: number;
  itemCount?: number;
  removedName?: string;
  error?: string;
  currency?: string;
  receipt?: { storeName: string; currency: string; items: { name: string; qty: number; price: number }[]; total: number; timestamp: string };
}

export async function pushAck(code: string, payload: SyncAck): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${code}/ack`, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return res.ok;
  } catch { return false; }
}

export async function pollAck(code: string): Promise<SyncAck | null> {
  try {
    const res = await fetch(`/api/sync/${code}/ack`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data: any = await res.json();
    return data?.ack ?? null;
  } catch { return null; }
}

export async function pushControl(code: string, action: 'undo' | 'checkout'): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${code}/control`, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    return res.ok;
  } catch { return false; }
}

export async function pollControl(code: string): Promise<'undo' | 'checkout' | null> {
  try {
    const res = await fetch(`/api/sync/${code}/control`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data: any = await res.json();
    return data?.control?.action ?? null;
  } catch { return null; }
}
