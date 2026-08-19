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
 inventoryValue:'Inventory Value',topSeller:'Top Seller (7d)',txThisWeek:'Transactions (7d)',noSalesYet:'No sales yet',
 pinLock:'PIN Lock',setPin:'Set PIN',changePin:'Change PIN',removePin:'Remove PIN',
 pinHint:'Optional PIN to protect this store on this device.',pinPrompt:'Set a 4-6 digit PIN:',
 pinConfirmPrompt:'Confirm PIN:',pinInvalid:'PIN must be 4-6 digits.',pinMismatch:'PINs do not match.',
 pinSet:'PIN lock enabled.',pinRemoveConfirm:'Remove PIN lock?',pinRemoved:'PIN lock removed.',
 lockedTitle:'Locked',lockedHint:'Enter your PIN to continue.',unlock:'Unlock',incorrectPin:'Incorrect PIN.',
 backupReminderTitle:'Back up your store',backupReminderBody:"It's been a while since your last backup.",
 backupReminderBodyNever:"You haven't backed up your store yet.",backupNow:'Backup now',
 notifications:'Notifications',notificationsHint:'Get a daily alert for low stock and expiring products.',
 notifyBody:'{low} low/out-of-stock, {exp} expiring soon.',
 salesTrend:'Sales (last 7 days)',date:'Date',topSellers30:'Top Sellers (30d)',
 scan:'Scan',cancel:'Cancel',scanUnsupported:'Barcode scanning is not supported on this device or browser.',
 scanCameraError:'Could not access the camera.'
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
 inventoryValue:'Halaga ng Imbentaryo',topSeller:'Pinakabenta (7d)',txThisWeek:'Transaksyon (7d)',noSalesYet:'Wala pang benta',
 pinLock:'PIN Lock',setPin:'Mag-set ng PIN',changePin:'Palitan ang PIN',removePin:'Alisin ang PIN',
 pinHint:'Opsyonal na PIN para protektahan ang tindahan sa device na ito.',pinPrompt:'Mag-set ng 4-6 digit na PIN:',
 pinConfirmPrompt:'Kumpirmahin ang PIN:',pinInvalid:'Dapat 4-6 digit ang PIN.',pinMismatch:'Hindi tugma ang PIN.',
 pinSet:'Na-enable ang PIN lock.',pinRemoveConfirm:'Alisin ang PIN lock?',pinRemoved:'Naalis ang PIN lock.',
 lockedTitle:'Naka-lock',lockedHint:'Ilagay ang PIN mo para magpatuloy.',unlock:'I-unlock',incorrectPin:'Maling PIN.',
 backupReminderTitle:'I-backup ang tindahan mo',backupReminderBody:'Matagal na mula noong huling backup mo.',
 backupReminderBodyNever:'Wala ka pang na-backup na tindahan.',backupNow:'Mag-backup ngayon',
 notifications:'Notifications',notificationsHint:'Makatanggap ng araw-araw na alerto para sa paubos at malapit nang mag-expire.',
 notifyBody:'{low} paubos/wala na, {exp} malapit nang mag-expire.',
 salesTrend:'Benta (huling 7 araw)',date:'Petsa',topSellers30:'Pinakabenta (30d)',
 scan:'Scan',cancel:'Kanselahin',scanUnsupported:'Hindi supported ang barcode scanning sa device o browser na ito.',
 scanCameraError:'Hindi ma-access ang camera.'
};

export function t(data:StoreData,key:string){return (data.store.language==='en'?en:fil)[key]??key;}
export function locale(data:StoreData){return data.store.language==='en'?'en-US':'fil-PH';}
