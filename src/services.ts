import type { StoreData, Product, TxType, InventoryTransaction, Customer, CreditType, CreditEntry } from './domain';
import { id, now, validQty } from './domain';

export class DomainError extends Error {}

const get = (d: StoreData, productId: string, includeArchived = false): Product => {
  const p = d.products.find(x => x.id === productId && (includeArchived || x.active));
  if (!p) throw new DomainError('Product not found or archived.');
  return p;
};

const positiveQty = (n: number) => {
  if (!Number.isInteger(n) || n <= 0) throw new DomainError('Quantity must be a positive whole number.');
  return n;
};

const commit = (
  d: StoreData,
  p: Product,
  type: TxType,
  change: number,
  reason: string,
  referenceId?: string,
): InventoryTransaction => {
  const previousQuantity = p.stock;
  const newQuantity = previousQuantity + change;
  if (!validQty(newQuantity)) throw new DomainError('Stock cannot become negative.');
  const timestamp = now();
  p.stock = newQuantity;
  p.updatedAt = timestamp;
  const transaction: InventoryTransaction = {
    id: id(),
    productId: p.id,
    type,
    quantityChange: change,
    previousQuantity,
    newQuantity,
    timestamp,
    ...(reason ? { reason } : {}),
    ...(referenceId ? { referenceId } : {}),
    ...(type === 'SALE' ? { salePrice: p.sellingPrice, saleCost: p.costPrice ?? 0 } : {}),
  };
  d.transactions.push(transaction);
  return transaction;
};

export function applyInventoryChange(
  d: StoreData,
  productId: string,
  change: number,
  type: TxType,
  reason: string,
): InventoryTransaction {
  if (!Number.isInteger(change) || !Number.isFinite(change) || change === 0) {
    throw new DomainError('Inventory change must be a non-zero whole number.');
  }
  if (!reason?.trim()) throw new DomainError('An inventory reason is required.');
  if (type === 'SALE' || type === 'SALE_REVERSAL') throw new DomainError('Use the sale/reversal service for sale transactions.');
  return commit(d, get(d, productId), type, change, reason.trim());
}

export function recordSale(d: StoreData, productId: string, quantity: number, referenceId?: string): InventoryTransaction {
  return commit(d, get(d, productId), 'SALE', -positiveQty(quantity), 'Sale', referenceId);
}

export function stockIn(d: StoreData, productId: string, quantity: number, reason = 'Stock-in'): InventoryTransaction {
  return commit(d, get(d, productId), 'STOCK_IN', positiveQty(quantity), reason.trim() || 'Stock-in');
}

export function adjust(
  d: StoreData,
  productId: string,
  type: Extract<TxType, 'DAMAGE' | 'EXPIRATION' | 'PERSONAL_USE' | 'ADJUSTMENT' | 'FOUND'>,
  quantity: number,
  reason: string,
): InventoryTransaction {
  if (!reason?.trim()) throw new DomainError('An adjustment reason is required.');
  const q = positiveQty(quantity);
  return commit(d, get(d, productId), type, type === 'FOUND' ? q : -q, reason.trim());
}

export function recordStockCount(d: StoreData, productId: string, actual: number): InventoryTransaction | null {
  if (!validQty(actual)) throw new DomainError('Actual stock must be a whole number >= 0.');
  const p = get(d, productId);
  const variance = actual - p.stock;
  return variance === 0 ? null : commit(d, p, 'ADJUSTMENT', variance, 'Physical stock count');
}

export function reverseTransaction(d: StoreData, transactionId: string): InventoryTransaction {
  const original = d.transactions.find(t => t.id === transactionId);
  if (!original) throw new DomainError('Transaction not found.');
  if (original.type === 'SALE_REVERSAL' || original.type === 'REVERSAL') throw new DomainError('A reversal cannot be reversed.');
  if (d.transactions.some(t => t.referenceId === original.id)) throw new DomainError('This transaction has already been reversed.');
  const p = get(d, original.productId, true);
  const reversal = commit(d, p, 'REVERSAL', -original.quantityChange, 'Undo last action', original.id);
  if (original.type === 'SALE' && original.referenceId) {
    const charge = d.creditLedger.find(e => e.type === 'CHARGE' && e.referenceId === original.referenceId);
    const customer = charge && d.customers.find(c => c.id === charge.customerId);
    if (charge && customer) {
      const lineAmount = -original.quantityChange * (original.salePrice ?? 0);
      if (lineAmount > 0) commitCredit(d, customer, 'PAYMENT', lineAmount, 'Sale reversed', original.id);
    }
  }
  return reversal;
}

const commitCredit = (d: StoreData, c: Customer, type: CreditType, amount: number, reason?: string, referenceId?: string): CreditEntry => {
  c.balance = c.balance + (type === 'CHARGE' ? amount : -amount);
  c.updatedAt = now();
  const entry: CreditEntry = { id: id(), customerId: c.id, type, amount, timestamp: now(), ...(reason ? { reason } : {}), ...(referenceId ? { referenceId } : {}) };
  d.creditLedger.push(entry);
  return entry;
};

const getCustomer = (d: StoreData, customerId: string): Customer => {
  const c = d.customers.find(x => x.id === customerId && !x.archived);
  if (!c) throw new DomainError('Customer not found or archived.');
  return c;
};

const positiveAmount = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) throw new DomainError('Amount must be a positive number.');
  return n;
};

export function chargeCustomer(d: StoreData, customerId: string, amount: number, reason?: string, referenceId?: string): CreditEntry {
  return commitCredit(d, getCustomer(d, customerId), 'CHARGE', positiveAmount(amount), reason, referenceId);
}

export function recordPayment(d: StoreData, customerId: string, amount: number, reason?: string): CreditEntry {
  const c = getCustomer(d, customerId);
  const amt = positiveAmount(amount);
  if (amt > c.balance + 1e-6) throw new DomainError('Payment cannot exceed the outstanding balance.');
  return commitCredit(d, c, 'PAYMENT', amt, reason);
}

export function suggestShopping(d: StoreData) {
  return d.products
    .filter(p => p.active && p.stock < p.targetStock)
    .map(p => ({ productId: p.id, name: p.name, quantity: Math.max(1, p.targetStock - p.stock) }));
}

export function todayKey(date = new Date(), timeZone?: string): string {
  if (timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const value = (type: string) => parts.find(p => p.type === type)?.value;
    return `${value('year')}-${value('month')}-${value('day')}`;
  }
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const cell = (v: unknown) => {
  const raw = v ?? '';
  const s = String(raw);
  const safe = typeof raw === 'string' && /^[=+\-@]/.test(s) ? "'" + s : s;
  return `"${safe.replaceAll('"', '""')}"`;
};

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  return [keys.map(cell).join(','), ...rows.map(r => keys.map(k => cell(r[k])).join(','))].join('\r\n');
}

export const productsCsv = (d: StoreData) => toCsv(d.products.map(p => ({
  id: p.id, product: p.name, price: p.sellingPrice, cost: p.costPrice ?? '', stock: p.stock,
  reorderLevel: p.reorderLevel, targetStock: p.targetStock, unit: p.unit, active: p.active,
  expirationDate: p.expirationDate ?? '',
})));

export const salesCsv = (d: StoreData) => toCsv(d.transactions.filter(t => t.type === 'SALE').map(t => ({
  id: t.id, productId: t.productId, quantity: -t.quantityChange, timestamp: t.timestamp, reason: t.reason ?? '',
  salePrice: t.salePrice ?? '', saleCost: t.saleCost ?? '',
})));

export const movementCsv = (d: StoreData) => toCsv(d.transactions.map(t => ({
  id: t.id, productId: t.productId, type: t.type, quantityChange: t.quantityChange,
  previousQuantity: t.previousQuantity, newQuantity: t.newQuantity, timestamp: t.timestamp,
  reason: t.reason ?? '', referenceId: t.referenceId ?? '',
})));

export function validateCsvRows(rows: Record<string, string>[]) {
  const errors: string[] = [];
  rows.forEach((r, i) => {
    const line = i + 2;
    const price = Number(r.price);
    const stock = Number(r.stock);
    if (!r.product?.trim()) errors.push(`Row ${line}: Product is required.`);
    if (!Number.isFinite(price) || price < 0) errors.push(`Row ${line}: Price must be >= 0.`);
    if (!Number.isInteger(stock) || stock < 0) errors.push(`Row ${line}: Stock must be a whole number >= 0.`);
  });
  return errors;
}
