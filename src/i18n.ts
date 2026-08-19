import type { StoreData } from './domain';

const en:Record<string,string>={
 home:'My Store',sales:'Sales',products:'Products',low:'Low Stock',buy:'Shopping List',history:'History',backup:'Backup',
 simple:'Simple',advanced:'Advanced',settings:'Appearance',theme:'Theme',light:'Light',dark:'Dark',system:'System',
 language:'Language',accent:'Accent color',save:'Save settings',reset:'Reset appearance',appearance:'Appearance',
 storeName:'Store name',settingsSaved:'Settings saved.',welcome:'Welcome to Lightweight IMS',
 auto:'Automatic',close:'Close',menu:'Menu'
};
const fil:Record<string,string>={
 home:'Aking Tindahan',sales:'Benta',products:'Paninda',low:'Paubos',buy:'Bibilhin',history:'History',backup:'Backup',
 simple:'Simple',advanced:'Advanced',settings:'Itsura',theme:'Tema',light:'Maliwanag',dark:'Madilim',system:'System',
 language:'Wika',accent:'Kulay',save:'I-save ang settings',reset:'Ibalik ang default na itsura',appearance:'Itsura',
 storeName:'Pangalan ng tindahan',settingsSaved:'Na-save ang settings.',welcome:'Maligayang pagdating sa Lightweight IMS',
 auto:'Awtomatiko',close:'Isara',menu:'Menu'
};

export function t(data:StoreData,key:string){return (data.store.language==='en'?en:fil)[key]??key;}
export function locale(data:StoreData){return data.store.language==='en'?'en-US':'fil-PH';}
