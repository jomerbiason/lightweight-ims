export type TxType="SALE"|"SALE_REVERSAL"|"REVERSAL"|"STOCK_IN"|"DAMAGE"|"EXPIRATION"|"ADJUSTMENT"|"PERSONAL_USE"|"FOUND"|"INITIAL_STOCK";
export interface Store{id:string;name:string;currency:string;language:"en"|"fil";timezone:string;createdAt:string;updatedAt:string;snapshotVersion:number;snapshotId:string}
export interface Category{id:string;name:string;archived:boolean;createdAt:string;updatedAt:string}
export interface Product{id:string;name:string;categoryId?:string;sku?:string;barcode?:string;sellingPrice:number;costPrice?:number;stock:number;reorderLevel:number;targetStock:number;unit:string;active:boolean;expirationDate?:string;createdAt:string;updatedAt:string}
export interface InventoryTransaction{id:string;productId:string;type:TxType;quantityChange:number;previousQuantity:number;newQuantity:number;timestamp:string;reason?:string;referenceId?:string;salePrice?:number;saleCost?:number}
export interface ShoppingItem{id:string;productId?:string;name:string;quantity:number;purchased:boolean;createdAt:string}
export interface StoreSession{id:string;openedAt:string;closedAt?:string;openingCash?:number;closingCash?:number;expectedCash?:number;variance?:number}
export interface Customer{id:string;name:string;phone?:string;balance:number;archived:boolean;createdAt:string;updatedAt:string}
export interface Supplier{id:string;name:string;phone?:string;archived:boolean;createdAt:string;updatedAt:string}
export type CreditType="CHARGE"|"PAYMENT";
export interface CreditEntry{id:string;customerId:string;type:CreditType;amount:number;timestamp:string;reason?:string;referenceId?:string}
export interface StoreData{store:Store;categories:Category[];products:Product[];transactions:InventoryTransaction[];shoppingList:ShoppingItem[];sessions:StoreSession[];customers:Customer[];suppliers:Supplier[];creditLedger:CreditEntry[];settings:Record<string,unknown>}
export const id=()=>crypto.randomUUID(),now=()=>new Date().toISOString();
export const status=(p:Product)=>p.stock<=0?"out":p.stock<=p.reorderLevel?"low":"normal";
export function expirationStatus(p:Product, today=new Date()){if(!p.expirationDate)return "none";const d=new Date(p.expirationDate+"T23:59:59").getTime();const days=(d-today.getTime())/86400000;if(days<0)return "expired";if(days<=7)return "soon";return "normal";}
export const validQty=(n:number)=>Number.isInteger(n)&&Number.isFinite(n)&&n>=0;
export function estimatedProfit(ts:InventoryTransaction[],ps:Product[]){let salesTotal=0,cost=0;for(const t of ts.filter(x=>x.type==="SALE")){const p=ps.find(x=>x.id===t.productId);const price=t.salePrice??p?.sellingPrice;const unitCost=t.saleCost??p?.costPrice??0;if(typeof price==='number'&&Number.isFinite(price)){salesTotal+=-t.quantityChange*price;cost+=-t.quantityChange*unitCost}}return{salesTotal,cost,profit:salesTotal-cost}}
