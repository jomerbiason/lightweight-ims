import { describe, it, expect } from 'vitest';
import { adjust, productsCsv, recordSale, recordStockCount, reverseTransaction } from '../src/services';
import { migrateStore } from '../src/migrations';
import type { StoreData } from '../src/domain';

const make = (): StoreData => ({
  store: { id: 's', name: 'S', currency: 'PHP', language: 'fil', timezone: 'UTC', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), snapshotVersion: 1, snapshotId: 'snap' },
  categories: [],
  products: [{ id: 'p', name: 'Rice', sellingPrice: 50, stock: 10, reorderLevel: 2, targetStock: 20, unit: 'pcs', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
  transactions: [], shoppingList: [], sessions: [], settings: {}
});

describe('V1.3 compatibility and hardening', () => {
  it('sale prevents negative stock', () => {
    const x = make();
    recordSale(x, 'p', 3);
    expect(x.products[0].stock).toBe(7);
    expect(() => recordSale(x, 'p', 8)).toThrow();
  });

  it('requires adjustment reason', () => {
    expect(() => adjust(make(), 'p', 'DAMAGE', 1, '')).toThrow();
  });

  it('counts physical stock variance', () => {
    const x = make();
    const tx = recordStockCount(x, 'p', 14);
    expect(x.products[0].stock).toBe(14);
    expect(tx?.reason).toBe('Physical stock count');
  });

  it('does nothing when physical count has no variance', () => {
    const x = make();
    expect(recordStockCount(x, 'p', 10)).toBeNull();
    expect(x.transactions).toHaveLength(0);
  });

  it('undoes with a typed reversal reference', () => {
    const x = make();
    const original = recordSale(x, 'p', 2);
    const reversal = reverseTransaction(x, original.id);
    expect(x.products[0].stock).toBe(10);
    expect(reversal.type).toBe('REVERSAL');
    expect(reversal.referenceId).toBe(original.id);
  });

  it('prevents double reversal', () => {
    const x = make();
    const original = recordSale(x, 'p', 2);
    reverseTransaction(x, original.id);
    expect(() => reverseTransaction(x, original.id)).toThrow();
  });

  it('migrates a V1 store file to V2', () => {
    const x: any = { format: 'open-store', formatVersion: 1, store: { id: 's', name: 'S', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, products: [], transactions: [], shoppingList: [], categories: [] };
    const migrated: any = migrateStore(x);
    expect(migrated.formatVersion).toBe(2);
    expect(migrated.applicationVersion).toBe('1.3.3');
  });

  it('escapes formula strings without corrupting numeric negatives', () => {
    const x = make();
    x.products[0].name = '=1+1';
    expect(productsCsv(x)).toContain("'=1+1");
  });
});
