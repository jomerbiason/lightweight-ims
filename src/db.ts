import type { StoreData } from './domain';

const DB = 'lightweight-ims';
const VER = 3;
const STORES = ['store','categories','products','transactions','shoppingList','sessions','settings','snapshots'] as const;
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, VER);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const name of STORES) if (!database.objectStoreNames.contains(name)) database.createObjectStore(name, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export async function save(data: StoreData) {
  const database = await openDb();
  const tx = database.transaction(STORES.filter(s => s !== 'snapshots'), 'readwrite');
  tx.objectStore('store').clear(); tx.objectStore('store').put(data.store);
  for (const [name, values] of [['categories',data.categories],['products',data.products],['transactions',data.transactions],['shoppingList',data.shoppingList],['sessions',data.sessions]] as const) {
    const os = tx.objectStore(name); os.clear(); for (const value of values) os.put(value);
  }
  const settings = tx.objectStore('settings'); settings.clear(); settings.put({ id: 'settings', ...data.settings });
  await new Promise<void>((resolve, reject) => { tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error); });
}

export async function safetySnapshot(data: StoreData) {
  const database = await openDb();
  const tx = database.transaction('snapshots', 'readwrite');
  tx.objectStore('snapshots').put({ id: data.store.snapshotId, createdAt: new Date().toISOString(), data: structuredClone(data) });
  await new Promise<void>((resolve, reject) => { tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error); });
}

const getAll = (database: IDBDatabase, name: string) => new Promise<any[]>((resolve,reject) => { const r=database.transaction(name).objectStore(name).getAll(); r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error); });

export async function load(): Promise<StoreData|null> {
  const database = await openDb();
  const stores = await getAll(database, 'store');
  const store = stores[0];
  if (!store) return null;
  const settingsRows = await getAll(database, 'settings');
  const settings = settingsRows[0] ?? { id:'settings' };
  return { store, categories: await getAll(database,'categories'), products: await getAll(database,'products'), transactions: await getAll(database,'transactions'), shoppingList: await getAll(database,'shoppingList'), sessions: await getAll(database,'sessions'), settings: Object.fromEntries(Object.entries(settings).filter(([k]) => k !== 'id')) };
}
