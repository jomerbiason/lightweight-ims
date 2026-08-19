import type { StoreData } from './domain';
const en:Record<string,string>={home:'My Store',sales:'Sales',products:'Products',low:'Low Stock',buy:'Shopping List',history:'History',backup:'Backup',simple:'Simple',advanced:'Advanced'};
const fil:Record<string,string>={home:'Aking Tindahan',sales:'Benta',products:'Paninda',low:'Paubos',buy:'Bibilhin',history:'History',backup:'Backup',simple:'Simple',advanced:'Advanced'};
export function t(data:StoreData,key:string){return (data.store.language==='en'?en:fil)[key]??key;}
