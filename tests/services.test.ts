import { describe, it, expect } from 'vitest';
import { applyInventoryChange, recordSale, stockIn, adjust, recordStockCount, reverseTransaction, todayKey, salesCsv, chargeCustomer, recordPayment } from '../src/services';
import type { StoreData } from '../src/domain';
const make=():StoreData=>({store:{id:'s',name:'S',currency:'PHP',language:'fil',timezone:'UTC',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),snapshotVersion:1,snapshotId:'snap'},categories:[],products:[{id:'p',name:'Coke',sellingPrice:20,stock:10,reorderLevel:3,targetStock:20,unit:'pcs',active:true,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}],transactions:[],shoppingList:[],sessions:[],customers:[],suppliers:[],creditLedger:[],settings:{}});
describe('inventory services',()=>{
 it('records a sale and keeps audit history',()=>{const d=make();const t=recordSale(d,'p',3);expect(d.products[0].stock).toBe(7);expect(t.type).toBe('SALE');expect(t.previousQuantity).toBe(10);});
 it('rejects negative resulting stock',()=>{const d=make();expect(()=>applyInventoryChange(d,'p',-11,'DAMAGE','bad')).toThrow();});
 it('records stock in',()=>{const d=make();stockIn(d,'p',5);expect(d.products[0].stock).toBe(15);});
 it('requires adjustment reason',()=>{const d=make();expect(()=>adjust(d,'p','DAMAGE',1,'')).toThrow();});
 it('applies physical count as variance',()=>{const d=make();recordStockCount(d,'p',6);expect(d.products[0].stock).toBe(6);expect(d.transactions[0].reason).toBe('Physical stock count');});
 it('undoes without deleting the original transaction',()=>{const d=make();const t=recordSale(d,'p',2);reverseTransaction(d,t.id);expect(d.products[0].stock).toBe(10);expect(d.transactions).toHaveLength(2);expect(d.transactions[1].referenceId).toBe(t.id);});
});
it('snapshots sale price and cost for historical reporting',()=>{const d=make();d.products[0].costPrice=10;const t=recordSale(d,'p',2);d.products[0].sellingPrice=30;d.products[0].costPrice=20;expect(t.salePrice).toBe(20);expect(t.saleCost).toBe(10);});
it('allows reversal of a transaction for an archived product',()=>{const d=make();const t=recordSale(d,'p',2);d.products[0].active=false;reverseTransaction(d,t.id);expect(d.products[0].stock).toBe(10);});
it('uses an explicit timezone for daily keys',()=>{expect(todayKey(new Date('2026-08-18T16:30:00Z'),'Asia/Manila')).toBe('2026-08-19');});
it('exports immutable sale snapshots to CSV',()=>{const d:any={products:[{id:'p',name:'P',sellingPrice:10,costPrice:4,stock:2,reorderLevel:1,targetStock:2,unit:'pcs',active:true,createdAt:'x',updatedAt:'x'}],transactions:[],categories:[],shoppingList:[],sessions:[],settings:{}};recordSale(d,'p',1);expect(salesCsv(d)).toContain('10');expect(salesCsv(d)).toContain('4');});
describe('customer credit ledger',()=>{
 const makeWithCustomer=():StoreData=>{const d=make();const t0=new Date().toISOString();d.customers.push({id:'c',name:'Aling Nena',balance:0,archived:false,createdAt:t0,updatedAt:t0});return d};
 it('charges a customer and increases their balance',()=>{const d=makeWithCustomer();const e=chargeCustomer(d,'c',100,'Sale');expect(d.customers[0].balance).toBe(100);expect(e.type).toBe('CHARGE');});
 it('records a payment and decreases the balance',()=>{const d=makeWithCustomer();chargeCustomer(d,'c',100,'Sale');recordPayment(d,'c',60);expect(d.customers[0].balance).toBe(40);});
 it('rejects a payment larger than the balance',()=>{const d=makeWithCustomer();chargeCustomer(d,'c',50,'Sale');expect(()=>recordPayment(d,'c',100)).toThrow();});
 it('rejects charging an archived or missing customer',()=>{const d=makeWithCustomer();d.customers[0].archived=true;expect(()=>chargeCustomer(d,'c',10,'Sale')).toThrow();expect(()=>chargeCustomer(d,'missing',10,'Sale')).toThrow();});
 it('reversing a sale charged to a customer refunds their balance',()=>{const d=makeWithCustomer();const saleId='sale-1';const t=recordSale(d,'p',2,saleId);chargeCustomer(d,'c',40,'Sale',saleId);expect(d.customers[0].balance).toBe(40);reverseTransaction(d,t.id);expect(d.customers[0].balance).toBe(0);});
});
