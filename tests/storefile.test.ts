import { describe, it, expect } from 'vitest';
import { FORMAT_VERSION, pack, unpack, validate } from '../src/storefile';
import type { StoreData } from '../src/domain';

const base = (): StoreData => ({
  store: { id: 's', name: 'S', currency: 'PHP', language: 'fil', timezone: 'UTC', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), snapshotVersion: 1, snapshotId: 'snap' },
  categories: [], products: [], transactions: [], shoppingList: [], sessions: [], customers: [], suppliers: [], creditLedger: [], settings: {}
});

describe('store validation and migration', () => {
  it('uses the V3 store format', () => expect(FORMAT_VERSION).toBe(3));

  it('packs and unpacks a valid store', () => {
    const text = pack(base());
    expect(JSON.parse(text).formatVersion).toBe(3);
    expect(unpack(text).store.name).toBe('S');
  });

  it('migrates a V1 store during unpack', () => {
    const raw: any = { ...base(), format: 'open-store', formatVersion: 1, applicationVersion: '1.3.1' };
    const restored: any = unpack(JSON.stringify(raw));
    expect(restored.formatVersion).toBe(3);
    expect(restored.applicationVersion).toBe('1.3.3');
    expect(restored.customers).toEqual([]);
  });

  it('rejects duplicate IDs', () => {
    const x: any = { ...base(), format: 'open-store', formatVersion: 3, products: [
      { id: 'p', name: 'A', sellingPrice: 1, stock: 1, reorderLevel: 1, targetStock: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'p', name: 'B', sellingPrice: 1, stock: 1, reorderLevel: 1, targetStock: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ] };
    expect(validate(x).some(e => e.includes('duplicate'))).toBe(true);
  });

  it('rejects a transaction that references a missing product', () => {
    const x: any = { ...base(), format: 'open-store', formatVersion: 3, transactions: [{ id: 't', productId: 'missing', quantityChange: -1, previousQuantity: 1, newQuantity: 0, timestamp: new Date().toISOString() }] };
    expect(validate(x).some(e => e.includes('missing product'))).toBe(true);
  });

  it('rejects a credit entry that references a missing customer', () => {
    const x: any = { ...base(), format: 'open-store', formatVersion: 3, creditLedger: [{ id: 'e', customerId: 'missing', type: 'CHARGE', amount: 10, timestamp: new Date().toISOString() }] };
    expect(validate(x).some(e => e.includes('missing customer'))).toBe(true);
  });
});
  it('rejects inconsistent transaction stock math',()=>{const x:any={...base(),format:'open-store',formatVersion:3,products:[{id:'p',name:'A',sellingPrice:1,stock:1,reorderLevel:1,targetStock:2,unit:'pcs',active:true,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}],transactions:[{id:'t',productId:'p',quantityChange:-1,previousQuantity:2,newQuantity:2,timestamp:new Date().toISOString()}]};expect(validate(x).some(e=>e.includes('inconsistent'))).toBe(true);});

it('rejects invalid transaction types and malformed categories',()=>{const raw:any={format:'open-store',formatVersion:3,store:{id:'s',name:'S',currency:'PHP',language:'en',timezone:'Asia/Manila',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z',snapshotVersion:0,snapshotId:'x'},categories:[{id:'c',name:'',archived:'no',createdAt:'bad',updatedAt:'bad'}],products:[],transactions:[{id:'t',productId:'missing',type:'BOGUS',quantityChange:1,previousQuantity:0,newQuantity:1,timestamp:'2026-01-01T00:00:00Z'}],shoppingList:[],sessions:[],customers:[],suppliers:[],creditLedger:[],settings:{}};const errors=validate(raw);expect(errors.some(e=>e.includes('invalid type'))).toBe(true);expect(errors.some(e=>e.includes('Category'))).toBe(true);});
