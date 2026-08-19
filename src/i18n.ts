import type { StoreData } from './domain';

const en:Record<string,string>={
 home:'My Store',sales:'Sales',products:'Products',low:'Low Stock',buy:'Shopping List',history:'History',backup:'Backup',
 settings:'Appearance',theme:'Theme',light:'Light',dark:'Dark',system:'System',
 language:'Language',accent:'Accent color',save:'Save settings',reset:'Reset appearance',appearance:'Appearance',
 storeName:'Store name',settingsSaved:'Settings saved.',welcome:'Welcome to Lightweight IMS',
 auto:'Automatic',close:'Close',menu:'Menu',
 heroSubtitle:'Digital notebook for your store • offline-first',sell:'Sell',
 outOfStock:'Out of stock',greetMorning:'Good morning',greetAfternoon:'Good afternoon',greetEvening:'Good evening',
 statusOut:'OUT',statusLow:'LOW',statusOk:'OK',noProducts:'No products yet.',searchProducts:'Search products...',
 addToBuy:'Add to Shopping List',noLowStock:'No low stock items. 👍',emptyBuyList:'Shopping list is empty.',
 noActivity:'No activity yet.',saleRecorded:'Sale recorded.',stockAdded:'Stock added.',buyListUpdated:'Shopping list updated.',
 storeDesc:'Simple, offline-first inventory for your store.',
 inventoryValue:'Inventory Value',topSeller:'Top Seller (7d)',txThisWeek:'Transactions (7d)',noSalesYet:'No sales yet'
};
const fil:Record<string,string>={
 home:'Aking Tindahan',sales:'Benta',products:'Paninda',low:'Paubos',buy:'Bibilhin',history:'History',backup:'Backup',
 settings:'Itsura',theme:'Tema',light:'Maliwanag',dark:'Madilim',system:'System',
 language:'Wika',accent:'Kulay',save:'I-save ang settings',reset:'Ibalik ang default na itsura',appearance:'Itsura',
 storeName:'Pangalan ng tindahan',settingsSaved:'Na-save ang settings.',welcome:'Maligayang pagdating sa Lightweight IMS',
 auto:'Awtomatiko',close:'Isara',menu:'Menu',
 heroSubtitle:'Digital notebook ng iyong tindahan • offline-first',sell:'Magbenta',
 outOfStock:'Wala na',greetMorning:'Magandang umaga',greetAfternoon:'Magandang hapon',greetEvening:'Magandang gabi',
 statusOut:'WALA NA',statusLow:'PAUBOS',statusOk:'OK',noProducts:'Wala pang paninda.',searchProducts:'Search paninda...',
 addToBuy:'Add to Bibilhin',noLowStock:'Walang paubos. 👍',emptyBuyList:'Walang nasa listahan.',
 noActivity:'Wala pang activity.',saleRecorded:'Naitala ang benta.',stockAdded:'Nadagdag ang stock.',buyListUpdated:'Bibilhin updated.',
 storeDesc:'Simple, offline-first inventory para sa sari-sari store.',
 inventoryValue:'Halaga ng Imbentaryo',topSeller:'Pinakabenta (7d)',txThisWeek:'Transaksyon (7d)',noSalesYet:'Wala pang benta'
};

export function t(data:StoreData,key:string){return (data.store.language==='en'?en:fil)[key]??key;}
export function locale(data:StoreData){return data.store.language==='en'?'en-US':'fil-PH';}
