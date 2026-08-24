// Client for the barcode-scan relay in worker/index.ts. Same-origin only (the Worker
// serves both the app and this API), so no base URL configuration is needed.
export function generateSyncCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function pushScan(code: string, barcode: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${code}/scan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ barcode }) });
    return res.ok;
  } catch { return false; }
}

export async function pollScan(code: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/sync/${code}/scan`);
    if (!res.ok) return null;
    const data: any = await res.json();
    return data?.scan?.barcode ?? null;
  } catch { return null; }
}

export async function pingRoom(code: string): Promise<void> {
  try { await fetch(`/api/sync/${code}/ping`, { method: 'POST' }); } catch {}
}
