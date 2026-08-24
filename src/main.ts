import './styles.css';
import { id, now, status, expirationStatus, estimatedProfit, unreversedSales, type StoreData, type Product, type Category, type InventoryTransaction } from './domain';
import { load, save, safetySnapshot } from './db';
import { pack, unpack } from './storefile';
import { t, locale } from './i18n';
import { adjust, applyInventoryChange, chargeCustomer, recordPayment, recordSale, recordStockCount, reverseTransaction, stockIn, suggestShopping, todayKey } from './services';
import { verifyLicenseKey, daysRemaining, type LicenseState } from './license';
import { generateSyncCode, pushScan, pollScan } from './sync';

let data: StoreData|null=null; let page='home'; let query=''; let toastTimer:number|undefined; let locked=false;
let cart:{productId:string,qty:number}[]=[];
let inventorySub:'products'|'low'|'buy'='products';
let miscSub:'customers'|'calc'|'notes'|'online'='customers';
let calcExpr='',calcResult='',calcJustEvaluated=false;
const $=(s:string)=>document.querySelector(s) as HTMLElement;
function esc(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))}
function money(n:number){return new Intl.NumberFormat(undefined,{style:'currency',currency:data?.store.currency||'PHP'}).format(n)}
function toast(s:string){const e=document.createElement('div');e.className='toast';e.textContent=s;document.body.append(e);clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.remove(),2500)}
async function sha256Hex(text:string){const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')}
async function setPin(){
  const pin=prompt(t(data!,'pinPrompt'));
  if(!pin)return;
  if(!/^\d{4,6}$/.test(pin))return alert(t(data!,'pinInvalid'));
  const confirmPin=prompt(t(data!,'pinConfirmPrompt'));
  if(pin!==confirmPin)return alert(t(data!,'pinMismatch'));
  data!.settings.pin=await sha256Hex(data!.store.id+':'+pin);
  await persist();
  toast(t(data!,'pinSet'));
}
async function removePin(){
  if(!confirm(t(data!,'pinRemoveConfirm')))return;
  delete data!.settings.pin;
  await persist();
  toast(t(data!,'pinRemoved'));
}
function lockScreen(){
  $('#app').innerHTML=`<div class="lock-screen"><div class="lock-card"><h1>🔒 ${t(data!,'lockedTitle')}</h1><p class="muted">${t(data!,'lockedHint')}</p><form id="unlock-form"><input id="unlock-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autofocus placeholder="PIN"><button class="primary">${t(data!,'unlock')}</button></form><p id="unlock-error" class="danger-text"></p></div></div>`;
  $('#unlock-form')!.addEventListener('submit', async e=>{
    e.preventDefault();
    const val=($('#unlock-pin') as HTMLInputElement).value;
    const hash=await sha256Hex(data!.store.id+':'+val);
    if(hash===data!.settings.pin){locked=false;render()}
    else{($('#unlock-error') as HTMLElement).textContent=t(data!,'incorrectPin');($('#unlock-pin') as HTMLInputElement).value=''}
  });
}
async function maybeNotify(){
  if(!data||!data.settings.notifications||typeof Notification==='undefined'||Notification.permission!=='granted')return;
  const lastNotified=data.settings.lastNotifiedAt as string|undefined;
  if(lastNotified&&todayKey(new Date(lastNotified),data.store.timezone)===todayKey(new Date(),data.store.timezone))return;
  const ps=data.products.filter(p=>p.active);
  const lowCount=ps.filter(p=>status(p)!=='normal').length;
  const expiringCount=ps.filter(p=>{const s=expirationStatus(p);return s==='soon'||s==='expired'}).length;
  if(lowCount||expiringCount){
    try{new Notification('Lightweight IMS',{body:t(data,'notifyBody').replace('{low}',String(lowCount)).replace('{exp}',String(expiringCount))})}catch{}
    data.settings.lastNotifiedAt=now();
    await persist();
  }
}
function applyAppearance(){
  const theme=String(data?.settings.theme||'system');
  const accent=String(data?.settings.accent||'#166534');
  const root=document.documentElement;
  root.style.setProperty('--accent',/^#[0-9a-f]{6}$/i.test(accent)?accent:'#166534');
  root.style.setProperty('--accent-2',/^#[0-9a-f]{6}$/i.test(accent)?accent:'#14532d');
  if(theme==='dark'||(theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))root.dataset.theme='dark';
  else root.dataset.theme='light';
}
function appearanceModal(){
  const theme=String(data!.settings.theme||'system'), accent=String(data!.settings.accent||'#166534');
  const m=modal(t(data!,'settings'),`<div class="settings-grid">
    <div class="setting-card"><label>${t(data!,'theme')}
      <select id="ui-theme"><option value="system"${theme==='system'?' selected':''}>${t(data!,'system')}</option><option value="light"${theme==='light'?' selected':''}>${t(data!,'light')}</option><option value="dark"${theme==='dark'?' selected':''}>${t(data!,'dark')}</option></select>
      <small>${data!.store.language==='en'?'Follow your device or choose a fixed theme.':'Sundin ang device o pumili ng permanenteng tema.'}</small>
    </label></div>
    <div class="setting-card"><label>${t(data!,'language')}
      <select id="ui-language"><option value="fil"${data!.store.language==='fil'?' selected':''}>Filipino</option><option value="en"${data!.store.language==='en'?' selected':''}>English</option></select>
      <small>${data!.store.language==='en'?'Changes the app interface language.':'Binabago ang wika ng interface ng app.'}</small>
    </label></div>
    <div class="setting-card"><label>${t(data!,'accent')}
      <div class="color-row"><input id="ui-accent" type="color" value="${accent}"><span id="accent-value">${accent}</span></div>
      <small>${data!.store.language==='en'?'Personalize buttons and highlights.':'I-personalize ang mga button at highlight.'}</small>
    </label></div>
    <div class="setting-card"><label>${t(data!,'storeName')}
      <input id="ui-store-name" value="${esc(data!.store.name)}" maxlength="80">
      <small>${data!.store.language==='en'?'Shown in the app header and dashboard.':'Makikita sa header at dashboard ng app.'}</small>
    </label></div>
    <div class="setting-card"><label>${t(data!,'pinLock')} ${tip(t(data!,'tipPin'))}
      <div class="actions">${data!.settings.pin?`<button type="button" class="secondary" id="change-pin">${t(data!,'changePin')}</button><button type="button" class="secondary" id="remove-pin">${t(data!,'removePin')}</button>`:`<button type="button" class="secondary" id="set-pin">${t(data!,'setPin')}</button>`}</div>
      <small>${t(data!,'pinHint')}</small>
    </label></div>
    <div class="setting-card"><label>${t(data!,'notifications')} ${tip(t(data!,'tipNotifications'))}
      <div class="actions"><input id="ui-notifications" type="checkbox" ${data!.settings.notifications?'checked':''}> ${t(data!,'notifications')}</div>
      <small>${t(data!,'notificationsHint')}</small>
    </label></div>
  </div>
  <div class="actions" style="margin-top:16px"><button class="primary" id="save-appearance">${t(data!,'save')}</button><button class="secondary" id="reset-appearance">${t(data!,'reset')}</button></div>`);
  m.querySelector('#set-pin')?.addEventListener('click',async()=>{await setPin();m.remove();appearanceModal()});
  m.querySelector('#change-pin')?.addEventListener('click',async()=>{await setPin();m.remove();appearanceModal()});
  m.querySelector('#remove-pin')?.addEventListener('click',async()=>{await removePin();m.remove();appearanceModal()});
  const color=m.querySelector('#ui-accent') as HTMLInputElement;
  const val=m.querySelector('#accent-value') as HTMLElement;
  color?.addEventListener('input',()=>val.textContent=color.value);
  m.querySelector('#save-appearance')?.addEventListener('click',async()=>{
    const lang=(m.querySelector('#ui-language') as HTMLSelectElement).value as 'en'|'fil';
    data!.store.language=lang;
    data!.store.name=(m.querySelector('#ui-store-name') as HTMLInputElement).value.trim()||data!.store.name;
    data!.settings.theme=(m.querySelector('#ui-theme') as HTMLSelectElement).value;
    data!.settings.accent=color.value;
    const wantsNotify=(m.querySelector('#ui-notifications') as HTMLInputElement).checked;
    if(wantsNotify&&typeof Notification!=='undefined'&&Notification.permission==='default'){
      try{await Notification.requestPermission()}catch{}
    }
    data!.settings.notifications=wantsNotify&&typeof Notification!=='undefined'&&Notification.permission==='granted';
    await persist(); applyAppearance(); m.remove(); toast(t(data!,'settingsSaved')); render();
  });
  m.querySelector('#reset-appearance')?.addEventListener('click',async()=>{
    data!.settings.theme='system';data!.settings.accent='#166534';applyAppearance();await persist();m.remove();toast(t(data!,'settingsSaved'));render();
  });
}

async function persist(){if(!data)throw new Error('No store loaded.');const old={updatedAt:data.store.updatedAt,snapshotVersion:data.store.snapshotVersion,snapshotId:data.store.snapshotId};data.store.updatedAt=now();data.store.snapshotVersion++;data.store.snapshotId=id();try{await save(data)}catch(e){Object.assign(data.store,old);throw new Error("We couldn't save this change. Your current store data has not been changed. Please try again.")}}
function initialStore(name:string,language:'en'|'fil'='en'):StoreData{const t=now();return{store:{id:id(),name,currency:'PHP',language,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,createdAt:t,updatedAt:t,snapshotVersion:1,snapshotId:id()},categories:[],products:[],transactions:[],shoppingList:[],sessions:[],customers:[],suppliers:[],creditLedger:[],settings:{theme:'system',accent:'#166534'}}}
function nav(){const items=[['home',`🏪 ${t(data!,'home')}`],['sales',`🛒 ${t(data!,'sales')}`],['products',`📦 ${t(data!,'products')}`],['customers',`🧰 ${t(data!,'miscTab')}`],['history',`🕘 ${t(data!,'history')}`],['backup',`💾 ${t(data!,'backup')}`]];return `<nav class="nav">${items.map(([k,l])=>`<button class="${page===k?'active':''}" data-page="${k}">${l}</button>`).join('')}</nav>`}
function subtabs(items:[string,string][],active:string,attr:string){return `<div class="subtabs">${items.map(([k,l])=>`<button type="button" class="chip${active===k?' active':''}" data-${attr}="${k}">${l}</button>`).join('')}</div>`}
function inventoryPage(){const bar=subtabs([['products',t(data!,'products')],['low',t(data!,'low')],['buy',t(data!,'buy')]],inventorySub,'subtab-inv');const body=inventorySub==='products'?products():inventorySub==='low'?low():buy();return bar+body}
function miscPage(){const bar=subtabs([['customers',t(data!,'customers')],['calc',t(data!,'calculator')],['notes',t(data!,'notes')],['online',t(data!,'onlineMode')]],miscSub,'subtab-misc');const body=miscSub==='customers'?customers():miscSub==='calc'?calculatorView():miscSub==='notes'?notesView():onlineView();return bar+body}
function calcTokens(expr:string){return expr.match(/(\d+\.?\d*|[+\-×÷])/g)||[]}
function calcEvaluate(expr:string):number{
  const tokens=calcTokens(expr);
  if(!tokens.length)return 0;
  const pass1:string[]=[tokens[0]!];
  for(let i=1;i<tokens.length;i+=2){
    const op=tokens[i]!,rhs=tokens[i+1]!;
    if(op==='×'||op==='÷'){
      const a=parseFloat(pass1.pop()!),b=parseFloat(rhs);
      pass1.push(String(op==='×'?a*b:a/b));
    }else{
      pass1.push(op,rhs);
    }
  }
  let result=parseFloat(pass1[0]);
  for(let j=1;j<pass1.length;j+=2){
    const op=pass1[j],val=parseFloat(pass1[j+1]);
    result=op==='+'?result+val:result-val;
  }
  return result;
}
function calcKey(k:string){return `<button type="button" class="calc-btn${'÷×−+'.includes(k)?' calc-op':''}${k==='='?' calc-equals':''}${k==='C'?' calc-clear':''}" data-calc="${k}">${k}</button>`}
function calculatorView(){return `<section class="section card"><h2>🧮 ${t(data!,'calculator')}</h2><div class="calc-display"><div class="calc-expr">${esc(calcExpr)||'&nbsp;'}</div><div class="calc-result">${esc(calcResult)||'0'}</div></div><div class="calc-grid">
  ${calcKey('C')}${calcKey('⌫')}${calcKey('÷')}<div class="calc-spacer"></div>
  ${calcKey('7')}${calcKey('8')}${calcKey('9')}${calcKey('×')}
  ${calcKey('4')}${calcKey('5')}${calcKey('6')}${calcKey('−')}
  ${calcKey('1')}${calcKey('2')}${calcKey('3')}${calcKey('+')}
  <button type="button" class="calc-btn calc-zero" data-calc="0">0</button>${calcKey('.')}${calcKey('=')}
</div></section>`}
function notesView(){const val=String(data!.settings.notes||'');return `<section class="section card"><h2>📝 ${t(data!,'notes')}</h2><div class="muted" style="margin-bottom:10px">${t(data!,'notesHint')}</div><textarea id="notes-text" class="notes-textarea" placeholder="${t(data!,'notesPlaceholder')}">${esc(val)}</textarea></section>`}
let notesTimer:number|undefined;
function handleCalc(key:string){
  const isOp='+−×÷'.includes(key);
  if(key==='C'){calcExpr='';calcResult='';calcJustEvaluated=false}
  else if(key==='⌫'){calcExpr=calcExpr.slice(0,-1);calcJustEvaluated=false}
  else if(key==='='){
    try{const r=calcEvaluate(calcExpr);calcResult=Number.isFinite(r)?String(Math.round(r*10000)/10000):t(data!,'calcError')}catch{calcResult=t(data!,'calcError')}
    calcJustEvaluated=true;
  }else{
    if(calcJustEvaluated){
      calcExpr=isOp?calcResult:'';
      calcResult='';
      calcJustEvaluated=false;
    }
    if(isOp&&(calcExpr===''||'+−×÷'.includes(calcExpr.slice(-1))))return;
    calcExpr+=key;
  }
  const c=$('#app').querySelector('.calc-expr'),r=$('#app').querySelector('.calc-result');
  if(c)c.innerHTML=esc(calcExpr)||'&nbsp;';
  if(r)r.textContent=calcResult||'0';
}
function tip(text:string){return `<button type="button" class="tip-btn" data-tip="${esc(text)}" aria-label="${t(data!,'help')}">ⓘ</button>`}
function closeTip(){document.querySelector('.tip-bubble')?.remove()}
function showTip(btn:HTMLElement){
  const already=btn.dataset.tipOpen==='1';
  closeTip();
  document.querySelectorAll('[data-tip-open]').forEach(b=>b.removeAttribute('data-tip-open'));
  if(already){btn.dataset.tipOpen='';delete btn.dataset.tipOpen;return}
  const text=btn.dataset.tip||'';
  const bubble=document.createElement('div');
  bubble.className='tip-bubble';
  bubble.textContent=text;
  document.body.appendChild(bubble);
  const rect=btn.getBoundingClientRect();
  const bw=bubble.getBoundingClientRect().width;
  let left=rect.left+window.scrollX;
  const maxLeft=window.scrollX+document.documentElement.clientWidth-bw-10;
  if(left>maxLeft)left=Math.max(10,maxLeft);
  bubble.style.left=`${left}px`;
  bubble.style.top=`${rect.bottom+window.scrollY+6}px`;
  btn.dataset.tipOpen='1';
}
document.addEventListener('click',e=>{
  const target=e.target as HTMLElement;
  const btn=target.closest('.tip-btn') as HTMLElement|null;
  if(btn){e.preventDefault();e.stopPropagation();showTip(btn);return}
  if(!target.closest('.tip-bubble'))closeTip();
});
function aboutModal(){
  const m=modal(`ℹ️ ${t(data!,'aboutTitle')}`,`
  <div class="about-body">
    <p>${t(data!,'aboutIntro')}</p>
    <h3>${t(data!,'aboutHowTitle')}</h3>
    <ol class="about-steps">
      <li>${t(data!,'aboutStep1')}</li>
      <li>${t(data!,'aboutStep2')}</li>
      <li>${t(data!,'aboutStep3')}</li>
      <li>${t(data!,'aboutStep4')}</li>
      <li>${t(data!,'aboutStep5')}</li>
    </ol>
    <h3>${t(data!,'aboutPrivacyTitle')}</h3>
    <p>${t(data!,'aboutPrivacyBody')}</p>
    <h3>${t(data!,'aboutFaqTitle')}</h3>
    <p><strong>${t(data!,'aboutFaqQ1')}</strong><br>${t(data!,'aboutFaqA1')}</p>
    <p><strong>${t(data!,'aboutFaqQ2')}</strong><br>${t(data!,'aboutFaqA2')}</p>
    <p><strong>${t(data!,'aboutFaqQ3')}</strong><br>${t(data!,'aboutFaqA3')}</p>
    <p class="muted" style="margin-top:16px">Lightweight IMS v1.3.3</p>
  </div>`);
}
function layout(content:string){$('#app').innerHTML=`<div class="app"><header class="topbar"><div class="brand-col"><div class="brand">Lightweight IMS <span class="muted">v1.3.3</span></div><div class="muted store-name" title="${esc(data?.store.name||'')}">${esc(data?.store.name||'')}</div></div><div class="actions"><button class="secondary" id="about" aria-label="${t(data!,'help')}">❓<span class="btn-label"> ${t(data!,'help')}</span></button><button class="secondary" id="appearance" aria-label="${t(data!,'settings')}">⚙️<span class="btn-label"> ${t(data!,'settings')}</span></button></div></header><main class="container">${nav()}${content}</main></div>`;document.querySelectorAll('[data-page]').forEach(x=>x.addEventListener('click',()=>{const next=(x as HTMLElement).dataset.page!;if(next!==page)query='';page=next;render()}));$('#appearance')?.addEventListener('click',appearanceModal);$('#about')?.addEventListener('click',aboutModal)}
function home(){const ps=data!.products.filter(p=>p.active),low=ps.filter(p=>status(p)==='low').length,out=ps.filter(p=>status(p)==='out').length,buy=data!.shoppingList.filter(x=>!x.purchased).length,sales=unreversedSales(data!.transactions).filter(t=>todayKey(new Date(t.timestamp), data!.store.timezone)===todayKey(new Date(), data!.store.timezone)),est=estimatedProfit(sales,ps);
  const weekAgo=Date.now()-7*86400000;
  const weekSales=unreversedSales(data!.transactions).filter(tx=>new Date(tx.timestamp).getTime()>=weekAgo);
  const soldByProduct=new Map<string,number>();
  for(const tx of weekSales)soldByProduct.set(tx.productId,(soldByProduct.get(tx.productId)||0)+(-tx.quantityChange));
  let topId='',topQty=0;
  for(const [pid,qty] of soldByProduct)if(qty>topQty){topQty=qty;topId=pid}
  const topProduct=data!.products.find(p=>p.id===topId);
  const inventoryValue=ps.reduce((sum,p)=>sum+p.stock*(p.costPrice??p.sellingPrice),0);
  const weeklyTxCount=data!.transactions.filter(tx=>new Date(tx.timestamp).getTime()>=weekAgo).length;
  const lastBackup=data!.settings.lastBackupAt as string|undefined;
  const daysSinceBackup=lastBackup?Math.floor((Date.now()-new Date(lastBackup).getTime())/86400000):Infinity;
  const backupBanner=daysSinceBackup>=7?`<section class="section card banner-warn"><div class="actions" style="justify-content:space-between;align-items:center;flex-wrap:wrap"><div><strong>${t(data!,'backupReminderTitle')}</strong><div class="muted">${lastBackup?t(data!,'backupReminderBody'):t(data!,'backupReminderBodyNever')}</div></div><button class="primary" id="backup-now">${t(data!,'backupNow')}</button></div></section>`:'';
  return `<section class="hero"><h1>${greet()}, ${esc(data!.store.name)}</h1><div class="muted">${t(data!,'heroSubtitle')}</div></section>${backupBanner}<section class="section grid compact"><div class="card">${t(data!,'products')}<div class="stat">${ps.length}</div></div><div class="card">${t(data!,'low')}<div class="stat">${low}</div></div><div class="card">${t(data!,'outOfStock')}<div class="stat">${out}</div></div><div class="card">${t(data!,'buy')}<div class="stat">${buy}</div></div><div class="card">Today's Sales<div class="stat">${money(est.salesTotal)}</div></div><div class="card">Est. Gross Profit<div class="stat">${money(est.profit)}</div></div><div class="card">${t(data!,'inventoryValue')}<div class="stat">${money(inventoryValue)}</div></div><div class="card">${t(data!,'topSeller')}<div class="stat">${topProduct?esc(topProduct.name):t(data!,'noSalesYet')}</div>${topProduct?`<div class="muted">${topQty} sold</div>`:''}</div><div class="card">${t(data!,'txThisWeek')}<div class="stat">${weeklyTxCount}</div></div></section>`}
function greet(){const h=new Date().getHours();return h<12?t(data!,'greetMorning'):h<18?t(data!,'greetAfternoon'):t(data!,'greetEvening')}
function productRows(ps:Product[], archived=false){return ps.map(p=>{const st=status(p);return `<tr><td><strong>${esc(p.name)}</strong><div class="muted">${esc(p.unit)}${p.barcode?` • ${esc(p.barcode)}`:''}</div></td><td>${money(p.sellingPrice)}</td><td>${p.stock}</td><td><span class="badge ${st}">${st==='out'?t(data!,'statusOut'):st==='low'?t(data!,'statusLow'):t(data!,'statusOk')}</span>${p.expirationDate?` <span class="badge ${expirationStatus(p)}">${expirationStatus(p)==='expired'?'EXPIRED':expirationStatus(p)==='soon'?'EXPIRING SOON':'EXPIRY OK'}</span>`:''}</td><td>${archived?`<button class="secondary" data-restore="${p.id}">Restore</button>`:`<button class="secondary" data-sale="${p.id}">${t(data!,'sell')}</button><button class="secondary" data-stock="${p.id}">+ Stock</button><button class="secondary" data-adjust="${p.id}">Adjust</button><button class="secondary" data-count="${p.id}">Count</button><button class="secondary" data-edit="${p.id}">Edit</button><button class="secondary" data-archive="${p.id}">Archive</button>`}</td></tr>`}).join('')||`<tr><td colspan="5" class="empty">${t(data!,'noProducts')}</td></tr>`}
function products(){const ps=data!.products.filter(p=>p.active&&p.name.toLowerCase().includes(query.toLowerCase()));return `<section class="section card"><div class="actions" style="justify-content:space-between"><div><h2>📦 ${t(data!,'products')}</h2><div class="muted">Search, edit, archive, or update stock.</div></div><button class="primary" id="add-product">+ Add Product</button></div><input id="search" class="search" placeholder="${t(data!,'searchProducts')}" value="${esc(query)}"><div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>${productRows(ps)}</tbody></table></div><details><summary>Archived products</summary><div class="table-wrap"><table class="table"><tbody>${productRows(data!.products.filter(p=>!p.active), true)}</tbody></table></div></details></section>`}
function cartQty(pid:string){return cart.find(c=>c.productId===pid)?.qty||0}
function frequentlySold(limit=6){
  const monthAgo=Date.now()-30*86400000;
  const soldQty=new Map<string,number>();
  for(const tx of unreversedSales(data!.transactions))if(new Date(tx.timestamp).getTime()>=monthAgo)soldQty.set(tx.productId,(soldQty.get(tx.productId)||0)+(-tx.quantityChange));
  return [...soldQty.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit)
    .map(([pid])=>data!.products.find(p=>p.id===pid)).filter((p):p is Product=>!!p&&p.active&&p.stock>0);
}
function sales(){
  const ps=data!.products.filter(p=>p.active&&p.stock>0&&p.name.toLowerCase().includes(query.toLowerCase()));
  const favorites=query?[]:frequentlySold();
  const cartTotal=cart.reduce((sum,c)=>{const p=data!.products.find(x=>x.id===c.productId);return sum+(p?p.sellingPrice*c.qty:0)},0);
  const cartRows=cart.map(c=>{const p=data!.products.find(x=>x.id===c.productId);if(!p)return'';return `<div class="card listrow"><strong>${esc(p.name)}</strong><span>${c.qty} x ${money(p.sellingPrice)}</span><div><button class="secondary" data-cart-dec="${p.id}">−</button><button class="secondary" data-cart-inc="${p.id}">+</button><button class="secondary" data-cart-remove="${p.id}">${t(data!,'removeItem')}</button></div></div>`}).join('');
  return `<section class="section card"><h2>🛒 ${t(data!,'sales')}</h2>
  ${favorites.length?`<div class="muted" style="margin-bottom:6px">${t(data!,'frequentlySold')}</div><div class="chips">${favorites.map(p=>`<button type="button" class="chip" data-cart-add="${p.id}">${esc(p.name)}</button>`).join('')}</div>`:''}
  <input id="search" class="search" placeholder="${t(data!,'searchProducts')}" value="${esc(query)}">
  <div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th></th></tr></thead><tbody>${ps.map(p=>`<tr><td>${esc(p.name)}</td><td>${money(p.sellingPrice)}</td><td>${p.stock}</td><td><button class="primary" data-cart-add="${p.id}">+ ${t(data!,'add')}${cartQty(p.id)?` (${cartQty(p.id)})`:''}</button></td></tr>`).join('')||`<tr><td colspan="4" class="empty">${t(data!,'noProducts')}</td></tr>`}</tbody></table></div>
  </section>
  ${cart.length?`<section class="section card"><h2>${t(data!,'cart')}</h2>${cartRows}
  ${data!.customers.filter(c=>!c.archived).length?`<label>${t(data!,'chargeTo')} ${tip(t(data!,'tipChargeTo'))}<select id="cart-customer"><option value="">${t(data!,'cash')}</option>${data!.customers.filter(c=>!c.archived).map(c=>`<option value="${c.id}">${esc(c.name)} (${money(c.balance)})</option>`).join('')}</select></label>`:''}
  <div class="actions" style="justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap"><strong>${t(data!,'total')}: ${money(cartTotal)}</strong><div class="actions"><button class="secondary" id="clear-cart">${t(data!,'clearCart')}</button><button class="primary" id="checkout">${t(data!,'checkout')}</button></div></div></section>`:''}`}
function low(){const ps=data!.products.filter(p=>p.active&&status(p)!=='normal');
  const expiring=data!.products.filter(p=>p.active&&(expirationStatus(p)==='soon'||expirationStatus(p)==='expired')).sort((a,b)=>(a.expirationDate||'').localeCompare(b.expirationDate||''));
  return `<section class="section card"><h2>⚠️ ${t(data!,'low')}</h2>${ps.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th>Stock</th><th>Reorder</th><th>Target</th><th></th></tr></thead><tbody>${ps.map(p=>`<tr><td>${esc(p.name)}</td><td>${p.stock}</td><td>${p.reorderLevel}</td><td>${p.targetStock}</td><td><button class="secondary" data-addbuy="${p.id}">${t(data!,'addToBuy')}</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">${t(data!,'noLowStock')}</div>`}</section>
  ${expiring.length?`<section class="section card"><h2>⏰ ${t(data!,'expiringSoon')}</h2><div class="muted" style="margin-bottom:10px">${t(data!,'expiringSoonHint')}</div><div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th>Stock</th><th>${t(data!,'expiry')}</th><th></th></tr></thead><tbody>${expiring.map(p=>`<tr><td>${esc(p.name)}</td><td>${p.stock}</td><td><span class="badge ${expirationStatus(p)}">${p.expirationDate}</span></td><td><button class="secondary" data-sale="${p.id}">${t(data!,'sell')}</button></td></tr>`).join('')}</tbody></table></div></section>`:''}`}
function buy(){const list=data!.shoppingList.filter(x=>!x.purchased);return `<section class="section card"><div class="actions" style="justify-content:space-between"><div><h2>🛍️ ${t(data!,'buy')}</h2><div class="muted">Auto-suggest below reorder level.</div></div><button class="secondary" id="auto-buy">Auto-suggest</button></div>${list.map(x=>`<div class="card listrow"><strong>${esc(x.name)}</strong><span>${x.quantity}</span><div><button class="secondary" data-dec="${x.id}">−</button><button class="secondary" data-inc="${x.id}">+</button><button class="secondary" data-purchased="${x.id}">Purchased</button><button class="secondary" data-remove="${x.id}">Remove</button></div></div>`).join('')||`<div class="empty">${t(data!,'emptyBuyList')}</div>`}<button class="secondary" id="add-buy">+ Add item</button></section>`}
function history(){const ts=[...data!.transactions].sort((a,b)=>b.timestamp.localeCompare(a.timestamp));return `<section class="section card"><div class="actions" style="justify-content:space-between"><h2>🕘 ${t(data!,'history')}</h2><select id="history-filter"><option value="ALL">All</option><option value="SALE">Sales</option><option value="STOCK_IN">Stock In</option><option value="ADJUSTMENT">Adjustments</option><option value="DAMAGE">Damage</option><option value="EXPIRATION">Expired</option><option value="PERSONAL_USE">Personal Use</option><option value="FOUND">Found</option><option value="SALE_REVERSAL">Undo</option></select><button class="secondary" id="undo">Undo Last Action</button></div><div id="history-table">${historyRows(ts)}</div></section>`}
function historyRows(ts:any[]){return ts.length?`<div class="table-wrap"><table class="table"><thead><tr><th>When</th><th>Product</th><th>Action</th><th>Change</th><th>Reason</th><th></th></tr></thead><tbody>${ts.map(row=>`<tr><td>${new Date(row.timestamp).toLocaleString()}</td><td>${esc(data!.products.find(p=>p.id===row.productId)?.name||'Unknown')}</td><td>${esc(row.type)}</td><td>${row.quantityChange>0?'+':''}${row.quantityChange}</td><td>${esc(row.reason||'')}</td><td>${row.type==='SALE'?`<button class="secondary" data-receipt="${row.id}">${t(data!,'receipt')}</button>`:''}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">${t(data!,'noActivity')}</div>`}
function reports(){const active=data!.products.filter(p=>p.active),sales=unreversedSales(data!.transactions),movements=data!.transactions.length,lowCount=active.filter(p=>status(p)==='low').length,out=active.filter(p=>status(p)==='out').length;
  const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d});
  const dayTotals=days.map(d=>{const key=todayKey(d,data!.store.timezone);const daySales=sales.filter(tx=>todayKey(new Date(tx.timestamp),data!.store.timezone)===key);const total=daySales.reduce((n,tx)=>{const p=data!.products.find(x=>x.id===tx.productId);const price=tx.salePrice??p?.sellingPrice??0;return n+(-tx.quantityChange)*price},0);return{key,total}});
  const monthAgo=Date.now()-30*86400000;
  const soldQty=new Map<string,number>();
  for(const tx of sales.filter(tx=>new Date(tx.timestamp).getTime()>=monthAgo))soldQty.set(tx.productId,(soldQty.get(tx.productId)||0)+(-tx.quantityChange));
  const topSellers=[...soldQty.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([pid,qty])=>({name:data!.products.find(p=>p.id===pid)?.name||'Unknown',qty}));
  return `<section class="section grid"><div class="card"><h2>Current Inventory ${tip(t(data!,'tipReports'))}</h2><div class="stat">${active.length}</div><div class="muted">Active products</div></div><div class="card"><h2>Sales History</h2><div class="stat">${sales.reduce((n,t)=>n+(-t.quantityChange),0)}</div><div class="muted">Items sold</div></div><div class="card"><h2>Stock Movement</h2><div class="stat">${movements}</div><div class="muted">Transactions</div></div><div class="card"><h2>Low Stock</h2><div class="stat">${lowCount}</div></div><div class="card"><h2>Out of Stock</h2><div class="stat">${out}</div></div></section><section class="section card"><h2>${t(data!,'salesTrend')}</h2><div class="table-wrap"><table class="table"><thead><tr><th>${t(data!,'date')}</th><th>${t(data!,'sales')}</th></tr></thead><tbody>${dayTotals.map(d=>`<tr><td>${d.key}</td><td>${money(d.total)}</td></tr>`).join('')}</tbody></table></div></section><section class="section card"><h2>${t(data!,'topSellers30')}</h2>${topSellers.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th>Qty sold</th></tr></thead><tbody>${topSellers.map(s=>`<tr><td>${esc(s.name)}</td><td>${s.qty}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">${t(data!,'noSalesYet')}</div>`}</section>`}
function backup(){return `<section class="section grid"><div class="card"><h2>💾 ${t(data!,'backupTitle')} ${tip(t(data!,'tipBackup'))}</h2><p>${t(data!,'backupBody')}</p><button class="primary" id="export">${t(data!,'saveStoreFile')}</button></div><div class="card"><h2>${t(data!,'restoreTitle')}</h2><p>${t(data!,'restoreBody')}</p><input id="import-file" type="file" accept=".store,application/json"><p class="muted">${t(data!,'restoreHint')}</p></div><div class="card"><h2>CSV ${tip(t(data!,'tipCsv'))}</h2><p>${t(data!,'csvBody')}</p><button class="secondary" id="csv-products">${t(data!,'products')}</button><button class="secondary" id="csv-sales">${t(data!,'sales')}</button><button class="secondary" id="csv-movement">${t(data!,'inventoryMovements')}</button><hr><label>${t(data!,'importProducts')}<input id="csv-import-file" type="file" accept=".csv,text/csv"></label></div><div class="card"><h2>${t(data!,'settings')}</h2><label><input id="session-toggle" type="checkbox"> ${t(data!,'storeSessions')}</label><p class="muted">${t(data!,'storeSessionsHint')}</p></div></section>`}
async function openScanOverlay(onDetect:(code:string)=>boolean):Promise<{stop:()=>void}|undefined>{
  if(!('BarcodeDetector' in window)){alert(t(data!,'scanUnsupported'));return}
  let stream:MediaStream;
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})}
  catch(e){alert(t(data!,'scanCameraError'));return}
  const video=document.createElement('video');video.srcObject=stream;video.setAttribute('playsinline','');video.setAttribute('muted','');await video.play();
  const overlay=document.createElement('div');overlay.className='scan-overlay';
  overlay.append(video);
  const box=document.createElement('div');box.className='scan-box';overlay.append(box);
  const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.id='scan-cancel';cancel.textContent=t(data!,'cancel');overlay.append(cancel);
  document.body.append(overlay);
  let stopped=false;
  const stop=()=>{stopped=true;stream.getTracks().forEach(tr=>tr.stop());overlay.remove()};
  cancel.addEventListener('click',stop);
  const detector=new (window as any).BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128']});
  const tick=async()=>{
    if(stopped)return;
    try{const codes=await detector.detect(video);if(codes.length){const shouldStop=onDetect(codes[0].rawValue);if(shouldStop){stop();return}}}catch{}
    requestAnimationFrame(tick);
  };
  tick();
  return {stop};
}
async function scanBarcode(targetInputId:string){
  await openScanOverlay(code=>{const input=document.querySelector('#'+targetInputId) as HTMLInputElement;if(input)input.value=code;return true});
}
let syncScannerHandle:{stop:()=>void}|undefined;
async function startScannerMode(code:string){
  if(syncScannerHandle)return;
  let lastSent='',lastSentAt=0;
  const handle=await openScanOverlay(barcode=>{
    const nowMs=Date.now();
    if(barcode!==lastSent||nowMs-lastSentAt>2000){
      lastSent=barcode;lastSentAt=nowMs;
      pushScan(code,barcode);
      toast(`${t(data!,'scanSent')}: ${barcode}`);
    }
    return false;
  });
  syncScannerHandle=handle;
}
function stopScannerMode(){syncScannerHandle?.stop();syncScannerHandle=undefined}
let syncPollTimer:number|undefined;
function startSyncPolling(code:string){
  stopSyncPolling();
  syncPollTimer=window.setInterval(async()=>{
    const barcode=await pollScan(code);
    if(barcode)handleIncomingScan(barcode);
  },2500);
}
function stopSyncPolling(){if(syncPollTimer){clearInterval(syncPollTimer);syncPollTimer=undefined}}
function handleIncomingScan(barcode:string){
  if(!data)return;
  const p=data.products.find(x=>x.barcode===barcode&&x.active);
  if(!p){toast(`${t(data,'unknownBarcode')}: ${barcode}`);return}
  if(p.stock<=0){toast(`${esc(p.name)}: ${t(data,'outOfStock')}`);return}
  const existing=cart.find(c=>c.productId===p.id);
  if(existing){if(existing.qty<p.stock)existing.qty++}
  else cart.push({productId:p.id,qty:1});
  toast(`${t(data,'add')}: ${p.name}`);
  if(page==='sales')render();
}
function licenseState():LicenseState|null{
  const lic=data!.settings.license as LicenseState|undefined;
  if(!lic)return null;
  if(new Date(lic.expiresAt).getTime()<Date.now())return null;
  return lic;
}
function onlineView(){
  const lic=licenseState();
  if(!lic)return `<section class="section card"><h2>🌐 ${t(data!,'onlineMode')} ${tip(t(data!,'tipOnlineMode'))}</h2><div class="muted" style="margin-bottom:12px">${t(data!,'onlineLicenseRequired')}</div><form class="form" id="license-form"><label>${t(data!,'licenseKey')}<input name="key" placeholder="xxxxx.xxxxx" required></label><button class="primary">${t(data!,'activate')}</button></form></section>`;
  const code=String(data!.settings.syncCode||'');
  const role=String(data!.settings.syncRole||'');
  return `<section class="section card"><h2>🌐 ${t(data!,'onlineMode')}</h2>
    <div class="muted" style="margin-bottom:12px">${t(data!,'licenseActive')}: ${esc(lic.tier)} — ${daysRemaining(lic.expiresAt)} ${t(data!,'daysLeft')}</div>
    ${code?`<p>${t(data!,'syncCode')}: <strong style="font-size:1.4rem;letter-spacing:.15em">${esc(code)}</strong></p>
    <div class="actions" style="margin-bottom:14px">
      <button type="button" class="secondary${role==='scanner'?' active':''}" id="role-scanner">📷 ${t(data!,'roleScanner')}</button>
      <button type="button" class="secondary${role==='display'?' active':''}" id="role-display">🖥️ ${t(data!,'roleDisplay')}</button>
      <button type="button" class="danger" id="leave-sync">${t(data!,'leaveSync')}</button>
    </div>
    ${role==='scanner'?`<button type="button" class="primary" id="start-scanning">📷 ${t(data!,'startScanning')}</button>`:''}
    ${role==='display'?`<div class="muted">${t(data!,'listeningForScans')}</div>`:''}`
    :`<div class="actions"><button type="button" class="primary" id="create-sync">${t(data!,'createSession')}</button></div>
    <form class="form" id="join-sync-form" style="margin-top:14px"><label>${t(data!,'joinSession')}<input name="code" maxlength="6" pattern="[0-9]{6}" placeholder="123456" required></label><button class="secondary">${t(data!,'join')}</button></form>`}
  </section>`;
}
function modal(title:string,body:string){const e=document.createElement('div');e.className='modal';e.innerHTML=`<div role="dialog" aria-modal="true"><div class="actions" style="justify-content:space-between"><h2>${title}</h2><button class="secondary" id="close">Close</button></div>${body}</div>`;document.body.append(e);e.querySelector('#close')!.addEventListener('click',()=>e.remove());return e}
function addProduct(){const m=modal('Add Product',`<form class="form" id="pf"><label>Name<input name="name" required autofocus></label><label>Category<select name="category"><option value="">No category</option>${data!.categories.filter(c=>!c.archived).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label><label>Barcode (optional)<div class="actions"><input name="barcode" id="add-barcode"><button type="button" class="secondary" id="scan-add-barcode">📷 ${t(data!,'scan')}</button></div></label><label>Selling Price<input name="price" type="number" min="0" step="0.01" required></label><label>Cost Price<input name="cost" type="number" min="0" step="0.01"></label><label>Initial Stock<input name="stock" type="number" min="0" step="1" value="0" required></label><label>${t(data!,'reorderLevel')} ${tip(t(data!,'tipReorderLevel'))}<input name="reorder" type="number" min="0" step="1" value="5"></label><label>${t(data!,'targetStock')} ${tip(t(data!,'tipTargetStock'))}<input name="target" type="number" min="0" step="1" value="20"></label><label>Unit<input name="unit" value="pcs"></label><label>Expiration (optional)<input name="expiration" type="date"></label><button class="primary">Save Product</button></form>`);m.querySelector('form')!.addEventListener('submit',async e=>{e.preventDefault();try{const f=new FormData(e.target as HTMLFormElement);const p:Product={id:id(),name:String(f.get('name')).trim(),categoryId:String(f.get('category')||'')||undefined,barcode:String(f.get('barcode')||'')||undefined,sellingPrice:Number(f.get('price')),costPrice:String(f.get('cost')||'')===''?undefined:Number(f.get('cost')),stock:Number(f.get('stock')),reorderLevel:Number(f.get('reorder')),targetStock:Number(f.get('target')),unit:String(f.get('unit')||'pcs'),active:true,expirationDate:String(f.get('expiration')||'')||undefined,createdAt:now(),updatedAt:now()};if(!p.name||!Number.isFinite(p.sellingPrice)||p.sellingPrice<0||!Number.isInteger(p.stock)||p.stock<0)throw new Error('Check the product values.');data!.products.push(p);if(p.stock)applyInventoryChange(data!,p.id,p.stock,'INITIAL_STOCK','Initial stock');await persist();m.remove();toast('Product added.');render()}catch(err){alert((err as Error).message)}});m.querySelector('#scan-add-barcode')?.addEventListener('click',()=>scanBarcode('add-barcode'))}
function editProduct(pid:string){const p=data!.products.find(x=>x.id===pid)!;const m=modal('Edit Product',`<form class="form" id="ef"><label>Name<input name="name" value="${esc(p.name)}" required></label><label>Selling Price<input name="price" type="number" min="0" step="0.01" value="${p.sellingPrice}" required></label><label>Cost Price<input name="cost" type="number" min="0" step="0.01" value="${p.costPrice??''}"></label><label>${t(data!,'reorderLevel')} ${tip(t(data!,'tipReorderLevel'))}<input name="reorder" type="number" min="0" value="${p.reorderLevel}"></label><label>${t(data!,'targetStock')} ${tip(t(data!,'tipTargetStock'))}<input name="target" type="number" min="0" value="${p.targetStock}"></label><label>Unit<input name="unit" value="${esc(p.unit)}"></label><label>Barcode<div class="actions"><input name="barcode" id="edit-barcode" value="${esc(p.barcode||'')}"><button type="button" class="secondary" id="scan-edit-barcode">📷 ${t(data!,'scan')}</button></div></label><label>Expiration<input name="expiration" type="date" value="${esc(p.expirationDate||'')}"></label><button class="primary">Save Changes</button></form>`);m.querySelector('form')!.addEventListener('submit',async e=>{e.preventDefault();try{const f=new FormData(e.target as HTMLFormElement);p.name=String(f.get('name')).trim();p.sellingPrice=Number(f.get('price'));p.costPrice=String(f.get('cost')||'')===''?undefined:Number(f.get('cost'));p.reorderLevel=Number(f.get('reorder'));p.targetStock=Number(f.get('target'));p.unit=String(f.get('unit')||'pcs');p.barcode=String(f.get('barcode')||'')||undefined;p.expirationDate=String(f.get('expiration')||'')||undefined;p.updatedAt=now();if(!p.name||p.sellingPrice<0||p.reorderLevel<0||p.targetStock<0)throw new Error('Check the product values.');await persist();m.remove();toast('Product updated.');render()}catch(err){alert((err as Error).message)}});m.querySelector('#scan-edit-barcode')?.addEventListener('click',()=>scanBarcode('edit-barcode'))}
function buildReceipt(p:Product,qty:number,tx:InventoryTransaction){
  const price=tx.salePrice??p.sellingPrice;const total=qty*price;
  return [
    data!.store.name,
    new Date(tx.timestamp).toLocaleString(locale(data!)),
    '------------------------------',
    p.name,
    `${qty} x ${money(price)} = ${money(total)}`,
    '------------------------------',
    `${t(data!,'total')}: ${money(total)}`,
    '',
    t(data!,'thankYou')
  ].join('\n');
}
function showReceipt(text:string){
  const canShare=typeof navigator.share==='function';
  const m=modal(t(data!,'receipt'),`<pre class="receipt">${esc(text)}</pre><div class="actions" style="margin-top:14px">${canShare?`<button class="primary" id="share-receipt">${t(data!,'share')}</button>`:''}<button class="secondary" id="copy-receipt">${t(data!,'copy')}</button></div>`);
  m.querySelector('#share-receipt')?.addEventListener('click',async()=>{try{await navigator.share({text,title:t(data!,'receipt')})}catch{}});
  m.querySelector('#copy-receipt')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(text);toast(t(data!,'copied'))}catch{alert(text)}});
}
function buildCartReceipt(items:{productId:string,qty:number,price:number}[],timestamp:string){
  const lines=[data!.store.name,new Date(timestamp).toLocaleString(locale(data!)),'------------------------------'];
  let total=0;
  for(const it of items){const p=data!.products.find(x=>x.id===it.productId);const name=p?p.name:'?';const lineTotal=it.qty*it.price;total+=lineTotal;lines.push(name,`${it.qty} x ${money(it.price)} = ${money(lineTotal)}`)}
  lines.push('------------------------------',`${t(data!,'total')}: ${money(total)}`,'',t(data!,'thankYou'));
  return lines.join('\n');
}
async function checkout(){
  if(!cart.length)return;
  const backup=structuredClone(data);
  try{
    const saleId=id();
    const items=cart.map(c=>{const p=data!.products.find(x=>x.id===c.productId)!;return{productId:c.productId,qty:c.qty,price:p.sellingPrice}});
    for(const it of items)recordSale(data!,it.productId,it.qty,saleId);
    const customerId=($('#cart-customer') as HTMLSelectElement|null)?.value||'';
    let customerName:string|undefined;
    if(customerId){
      const total=items.reduce((s,it)=>s+it.qty*it.price,0);
      chargeCustomer(data!,customerId,total,'Sale',saleId);
      customerName=data!.customers.find(c=>c.id===customerId)?.name;
    }
    try{await persist()}catch(e){data=backup;throw e}
    let receiptText=buildCartReceipt(items,now());
    if(customerName)receiptText+=`\n${t(data!,'chargedTo')}: ${customerName}`;
    cart=[];
    toast(t(data!,'saleRecorded'));
    render();
    showReceipt(receiptText);
  }catch(err){data=backup;alert((err as Error).message)}
}
function saleModal(pid:string){const p=data!.products.find(x=>x.id===pid)!;const m=modal('Record Sale',`<form class="form"><p><strong>${esc(p.name)}</strong> • ${money(p.sellingPrice)} • Stock ${p.stock}</p><label>Quantity<input name="qty" type="number" min="1" max="${p.stock}" value="1" required></label><button class="primary">Record Sale</button></form>`);m.querySelector('form')!.addEventListener('submit',async e=>{e.preventDefault();try{const qty=Number(new FormData(e.target as HTMLFormElement).get('qty'));const tx=recordSale(data!,pid,qty);await persist();m.remove();toast(t(data!,'saleRecorded'));render();showReceipt(buildReceipt(p,qty,tx))}catch(err){alert((err as Error).message)}})}
function stockModal(pid:string){const p=data!.products.find(x=>x.id===pid)!;const suppliers=data!.suppliers.filter(s=>!s.archived);const m=modal('Add Stock',`<form class="form"><p><strong>${esc(p.name)}</strong> • Current ${p.stock}</p><label>Quantity<input name="qty" type="number" min="1" value="1" required></label>${suppliers.length?`<label>${t(data!,'supplier')}<select name="supplier"><option value="">—</option>${suppliers.map(s=>`<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('')}</select></label>`:''}<label>Reason (optional)<input name="reason" placeholder="New delivery"></label><button class="primary">Add Stock</button></form>`);m.querySelector('form')!.addEventListener('submit',async e=>{e.preventDefault();try{const f=new FormData(e.target as HTMLFormElement);const supplierName=String(f.get('supplier')||'');const reasonBase=String(f.get('reason')||'')||undefined;const reason=supplierName?`${reasonBase||'Stock-in'} (${t(data!,'supplier')}: ${supplierName})`:reasonBase;stockIn(data!,pid,Number(f.get('qty')),reason);await persist();m.remove();toast(t(data!,'stockAdded'));render()}catch(err){alert((err as Error).message)}})}
function adjustModal(pid:string){const m=modal('Stock Adjustment',`<form class="form"><label>Type<select name="type"><option value="DAMAGE">Damaged</option><option value="EXPIRATION">Expired</option><option value="ADJUSTMENT">Missing / Correction / Other</option><option value="PERSONAL_USE">Personal use</option><option value="FOUND">Found</option></select></label><label>Quantity<input name="qty" type="number" min="1" value="1" required></label><label>Reason<input name="reason" required></label><button class="primary">Apply</button></form>`);m.querySelector('form')!.addEventListener('submit',async e=>{e.preventDefault();try{const f=new FormData(e.target as HTMLFormElement);adjust(data!,pid,f.get('type') as any,Number(f.get('qty')),String(f.get('reason')));await persist();m.remove();toast('Adjustment saved.');render()}catch(err){alert((err as Error).message)}})}
function countModal(pid:string){const p=data!.products.find(x=>x.id===pid)!;const m=modal('Stock Count',`<form class="form"><p>System count: <strong>${p.stock}</strong></p><label>Actual physical count<input name="actual" type="number" min="0" value="${p.stock}" required></label><button class="primary">Review Variance</button></form>`);m.querySelector('form')!.addEventListener('submit',async e=>{e.preventDefault();const actual=Number(new FormData(e.target as HTMLFormElement).get('actual'));const variance=actual-p.stock;if(variance===0){m.remove();toast('No variance.');return}if(!confirm(`Variance: ${variance>0?'+':''}${variance}. Apply?`))return;try{recordStockCount(data!,pid,actual);await persist();m.remove();toast('Stock count applied.');render()}catch(err){alert((err as Error).message)}})}
function categoryManager(){const m=modal('Categories',`<form class="form" id="cf"><label>New category<input name="name" placeholder="Drinks"></label><button class="secondary">Add Category</button></form><div id="cat-list">${data!.categories.map(c=>`<div class="listrow"><span>${esc(c.name)} ${c.archived?'(archived)':''}</span><button class="secondary" data-cat="${c.id}">${c.archived?'Restore':'Archive'}</button></div>`).join('')}</div>`);m.querySelector('form')!.addEventListener('submit',async e=>{e.preventDefault();const name=String(new FormData(e.target as HTMLFormElement).get('name')).trim();if(!name)return;if(data!.categories.some(c=>c.name.toLowerCase()===name.toLowerCase()))return alert('Category already exists.');const t=now();data!.categories.push({id:id(),name,archived:false,createdAt:t,updatedAt:t});await persist();m.remove();categoryManager()});m.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',async()=>{const c=data!.categories.find(x=>x.id===(b as HTMLElement).dataset.cat)!;c.archived=!c.archived;c.updatedAt=now();await persist();m.remove();categoryManager()}))}
function supplierManager(){const m=modal(t(data!,'suppliers'),`<form class="form" id="sf"><label>${t(data!,'name')}<input name="name" placeholder="ABC Traders"></label><label>${t(data!,'phone')}<input name="phone"></label><button class="secondary">${t(data!,'addSupplier')}</button></form><div id="sup-list">${data!.suppliers.map(s=>`<div class="listrow"><span>${esc(s.name)} ${s.archived?'(archived)':''}</span><button class="secondary" data-sup="${s.id}">${s.archived?'Restore':'Archive'}</button></div>`).join('')||`<div class="empty">${t(data!,'noSuppliers')}</div>`}</div>`);m.querySelector('form')!.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const name=String(f.get('name')).trim();if(!name)return;if(data!.suppliers.some(s=>s.name.toLowerCase()===name.toLowerCase()))return alert('Supplier already exists.');const t0=now();data!.suppliers.push({id:id(),name,phone:String(f.get('phone')||'')||undefined,archived:false,createdAt:t0,updatedAt:t0});await persist();m.remove();supplierManager()});m.querySelectorAll('[data-sup]').forEach(b=>b.addEventListener('click',async()=>{const s=data!.suppliers.find(x=>x.id===(b as HTMLElement).dataset.sup)!;s.archived=!s.archived;s.updatedAt=now();await persist();m.remove();supplierManager()}))}
function customers(){const list=data!.customers.filter(c=>!c.archived);const totalOwed=list.reduce((s,c)=>s+c.balance,0);return `<section class="section card"><div class="actions" style="justify-content:space-between"><div><h2>📒 ${t(data!,'customers')} ${tip(t(data!,'tipCustomers'))}</h2><div class="muted">${t(data!,'totalOwed')}: ${money(totalOwed)}</div></div><button class="primary" id="add-customer">+ ${t(data!,'addCustomer')}</button></div><div class="table-wrap"><table class="table"><thead><tr><th>${t(data!,'name')}</th><th>${t(data!,'balance')}</th><th></th></tr></thead><tbody>${list.map(c=>`<tr><td>${esc(c.name)}</td><td>${money(c.balance)}</td><td><button class="secondary" data-pay="${c.id}"${c.balance<=0?' disabled':''}>${t(data!,'recordPayment')}</button><button class="secondary" data-ledger="${c.id}">${t(data!,'history')}</button></td></tr>`).join('')||`<tr><td colspan="3" class="empty">${t(data!,'noCustomers')}</td></tr>`}</tbody></table></div></section>`}
function addCustomerModal(){const m=modal(t(data!,'addCustomer'),`<form class="form" id="cuf"><label>${t(data!,'name')}<input name="name" required autofocus></label><label>${t(data!,'phone')}<input name="phone"></label><button class="primary">${t(data!,'save')}</button></form>`);m.querySelector('form')!.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const name=String(f.get('name')).trim();if(!name)return;const t0=now();data!.customers.push({id:id(),name,phone:String(f.get('phone')||'')||undefined,balance:0,archived:false,createdAt:t0,updatedAt:t0});await persist();m.remove();render()})}
function paymentModal(cid:string){const c=data!.customers.find(x=>x.id===cid)!;const maxAmount=Math.ceil(c.balance*100)/100;const m=modal(t(data!,'recordPayment'),`<form class="form"><p><strong>${esc(c.name)}</strong> • ${t(data!,'balance')}: ${money(c.balance)}</p><label>${t(data!,'amount')}<input name="amount" type="number" min="0.01" step="0.01" max="${maxAmount}" required></label><button class="primary">${t(data!,'save')}</button></form>`);m.querySelector('form')!.addEventListener('submit',async e=>{e.preventDefault();try{const amount=Number(new FormData(e.target as HTMLFormElement).get('amount'));recordPayment(data!,cid,amount);await persist();m.remove();toast(t(data!,'paymentRecorded'));render()}catch(err){alert((err as Error).message)}})}
function ledgerModal(cid:string){const c=data!.customers.find(x=>x.id===cid)!;const entries=data!.creditLedger.filter(x=>x.customerId===cid).sort((a,b)=>b.timestamp.localeCompare(a.timestamp));modal(`${esc(c.name)} — ${t(data!,'history')}`,entries.length?`<div class="table-wrap"><table class="table"><thead><tr><th>${t(data!,'date')}</th><th>${t(data!,'type')}</th><th>${t(data!,'amount')}</th><th>${t(data!,'reason')}</th></tr></thead><tbody>${entries.map(x=>`<tr><td>${new Date(x.timestamp).toLocaleString()}</td><td>${x.type==='CHARGE'?t(data!,'charge'):t(data!,'payment')}</td><td>${x.type==='CHARGE'?'+':'-'}${money(x.amount)}</td><td>${esc(x.reason||'')}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">${t(data!,'noActivity')}</div>`)}
async function restoreProduct(pid:string){const p=data!.products.find(x=>x.id===pid)!;p.active=true;p.updatedAt=now();await persist();toast('Product restored.');render()}
async function archive(pid:string){const p=data!.products.find(x=>x.id===pid)!;if(!confirm(`Archive ${p.name}?`))return;p.active=false;p.updatedAt=now();await persist();toast('Product archived.');render()}
async function autoBuy(){for(const s of suggestShopping(data!)){const existing=data!.shoppingList.find(x=>x.productId===s.productId&&!x.purchased);if(existing)existing.quantity=s.quantity;else data!.shoppingList.push({id:id(),productId:s.productId,name:s.name,quantity:s.quantity,purchased:false,createdAt:now()})}await persist();toast(t(data!,'buyListUpdated'));render()}
function download(name:string,text:string,type='text/plain'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function safeCsv(s:string){return /^[=+\-@]/.test(s)?`'${s}`:s}
function csvExport(kind:'products'|'sales'|'movement'){let rows:string[][]=[];if(kind==='products'){rows=[['Product','Category','SKU','Barcode','Price','Cost','Stock','Reorder Level','Target Stock','Unit','Expiration']];for(const p of data!.products)rows.push([p.name,data!.categories.find(c=>c.id===p.categoryId)?.name||'',p.sku||'',p.barcode||'',String(p.sellingPrice),String(p.costPrice??''),String(p.stock),String(p.reorderLevel),String(p.targetStock),p.unit,p.expirationDate||''])}else if(kind==='sales'){rows=[['Timestamp','Product','Quantity','Price','Estimated Sales']];for(const t of data!.transactions.filter(t=>t.type==='SALE')){const p=data!.products.find(p=>p.id===t.productId);const price=t.salePrice??p?.sellingPrice??0;rows.push([t.timestamp,p?.name||'',String(-t.quantityChange),String(price),String((-t.quantityChange)*price)])}}else{rows=[['Timestamp','Product','Type','Change','Previous','New','Reason','Reference']];for(const t of data!.transactions)rows.push([t.timestamp,data!.products.find(p=>p.id===t.productId)?.name||'',t.type,String(t.quantityChange),String(t.previousQuantity),String(t.newQuantity),t.reason||'',t.referenceId||''])}const out=rows.map(r=>r.map(x=>`"${safeCsv(x).replace(/"/g,'""')}"`).join(',')).join('\n');download(`${kind}.csv`,out,'text/csv;charset=utf-8')}
function parseCsv(text:string):string[][]{const rows:string[][]=[];let row:string[]=[],cur='',quote=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quote&&text[i+1]==='"'){cur+='"';i++;}else quote=!quote;continue;}if(ch===','&&!quote){row.push(cur);cur='';continue;}if((ch==='\n'||ch==='\r')&&!quote){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cur);if(row.some(x=>x!==''))rows.push(row);row=[];cur='';continue;}cur+=ch;}if(quote)throw new Error('CSV has an unterminated quoted value.');row.push(cur);if(row.some(x=>x!==''))rows.push(row);return rows}
async function importCsv(file:File){try{const text=await file.text();const records=parseCsv(text);if(records.length<2)throw new Error('CSV is empty.');const h=records[0].map(x=>x.trim().toLowerCase());const pi=h.indexOf('product'),pr=h.indexOf('price'),si=h.indexOf('stock');if(pi<0||pr<0||si<0)throw new Error('CSV needs Product, Price, and Stock columns.');const rows:any[]=[];for(let i=1;i<records.length;i++){const c=records[i];const name=c[pi]?.trim(),price=Number(c[pr]),stock=Number(c[si]);if(!name||!Number.isFinite(price)||price<0||!Number.isInteger(stock)||stock<0)throw new Error(`CSV error on row ${i+1}. No rows were imported.`);rows.push({name,price,stock})}if(!confirm(`Preview: ${rows.length} products will be added. Continue?`))return;const backup=structuredClone(data);for(const r of rows){const p:Product={id:id(),name:r.name,sellingPrice:r.price,stock:0,reorderLevel:5,targetStock:20,unit:'pcs',active:true,createdAt:now(),updatedAt:now()};data!.products.push(p);if(r.stock)applyInventoryChange(data!,p.id,r.stock,'INITIAL_STOCK','CSV import')}try{await persist()}catch(e){data=backup;throw e}toast('CSV imported.');render()}catch(e){alert((e as Error).message)}}
async function exportStore(){download(`${data!.store.name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()||'my-store'}.store`,pack(data!),'application/json');data!.settings.lastBackupAt=now();await persist();render()}
async function importStore(file:File){try{const incoming=unpack(await file.text());const current=data;const older=current&&incoming.store.id===current.store.id&&incoming.store.snapshotVersion<current.store.snapshotVersion;if(older&&!confirm('This store file is older than the store currently on this device. Restore anyway?'))return;if(!confirm(`Restore "${incoming.store.name}"? Current data will be replaced after a safety snapshot.`))return;if(current)await safetySnapshot(current);data=incoming;try{await persist()}catch(e){data=current;throw e}toast('Store restored.');render()}catch(e){alert((e as Error).message)}}
async function sessions(){
  const open=data!.sessions.find(s=>!s.closedAt);
  if(open){
    const chargedRefs=new Set(data!.creditLedger.filter(e=>e.type==='CHARGE'&&e.referenceId).map(e=>e.referenceId));
    const expected=(open.openingCash||0)+unreversedSales(data!.transactions).filter(tx=>tx.timestamp>=open.openedAt&&!(tx.referenceId&&chargedRefs.has(tx.referenceId))).reduce((s,tx)=>s+(-tx.quantityChange)*(tx.salePrice??0),0);
    const actualStr=prompt(`${t(data!,'expectedCash')}: ${money(expected)}\n${t(data!,'actualCashPrompt')}`);
    if(actualStr===null)return;
    const actual=Number(actualStr);
    if(!Number.isFinite(actual)||actual<0)return alert(t(data!,'invalidAmount'));
    open.closedAt=now();open.expectedCash=expected;open.closingCash=actual;open.variance=actual-expected;
    await persist();
    toast(`${t(data!,'sessionClosed')} — ${t(data!,'variance')}: ${money(open.variance)}`);
  }else{
    const openingStr=prompt(t(data!,'openingCashPrompt'),'0');
    if(openingStr===null)return;
    const opening=Number(openingStr)||0;
    data!.sessions.push({id:id(),openedAt:now(),openingCash:opening});
    await persist();
    toast(t(data!,'sessionOpened'));
  }
  render();
}
function bind(){document.querySelectorAll('[data-sale]').forEach(e=>e.addEventListener('click',()=>saleModal((e as HTMLElement).dataset.sale!)));document.querySelectorAll('[data-stock]').forEach(e=>e.addEventListener('click',()=>stockModal((e as HTMLElement).dataset.stock!)));document.querySelectorAll('[data-edit]').forEach(e=>e.addEventListener('click',()=>editProduct((e as HTMLElement).dataset.edit!)));document.querySelectorAll('[data-archive]').forEach(e=>e.addEventListener('click',()=>archive((e as HTMLElement).dataset.archive!)));document.querySelectorAll('[data-restore]').forEach(e=>e.addEventListener('click',()=>restoreProduct((e as HTMLElement).dataset.restore!)));document.querySelectorAll('[data-adjust]').forEach(e=>e.addEventListener('click',()=>adjustModal((e as HTMLElement).dataset.adjust!)));document.querySelectorAll('[data-count]').forEach(e=>e.addEventListener('click',()=>countModal((e as HTMLElement).dataset.count!)));document.querySelectorAll('[data-addbuy]').forEach(e=>e.addEventListener('click',async()=>{const p=data!.products.find(x=>x.id===(e as HTMLElement).dataset.addbuy)!;const q=Math.max(1,p.targetStock-p.stock);const ex=data!.shoppingList.find(x=>x.productId===p.id&&!x.purchased);if(ex)ex.quantity=q;else data!.shoppingList.push({id:id(),productId:p.id,name:p.name,quantity:q,purchased:false,createdAt:now()});await persist();render()}));document.querySelectorAll('[data-purchased]').forEach(e=>e.addEventListener('click',async()=>{const x=data!.shoppingList.find(x=>x.id===(e as HTMLElement).dataset.purchased)!;x.purchased=true;await persist();render()}));document.querySelectorAll('[data-remove]').forEach(e=>e.addEventListener('click',async()=>{data!.shoppingList=data!.shoppingList.filter(x=>x.id!==(e as HTMLElement).dataset.remove);await persist();render()}));document.querySelectorAll('[data-inc]').forEach(e=>e.addEventListener('click',async()=>{const x=data!.shoppingList.find(x=>x.id===(e as HTMLElement).dataset.inc)!;x.quantity++;await persist();render()}));document.querySelectorAll('[data-dec]').forEach(e=>e.addEventListener('click',async()=>{const x=data!.shoppingList.find(x=>x.id===(e as HTMLElement).dataset.dec)!;x.quantity=Math.max(1,x.quantity-1);await persist();render()}));$('#add-product')?.addEventListener('click',addProduct);$('#search')?.addEventListener('input',e=>{query=(e.target as HTMLInputElement).value;render()});$('#auto-buy')?.addEventListener('click',autoBuy);$('#add-buy')?.addEventListener('click',()=>{const name=prompt('Item to buy');if(name){data!.shoppingList.push({id:id(),name:name.trim(),quantity:1,purchased:false,createdAt:now()});persist().then(render)}});$('#undo')?.addEventListener('click',async()=>{const tx=[...data!.transactions].reverse().find(t=>!data!.transactions.some(x=>x.referenceId===t.id)&&t.type!=='SALE_REVERSAL');if(!tx)return toast('Nothing to undo.');try{const group=tx.type==='SALE'&&tx.referenceId?data!.transactions.filter(x=>x.type==='SALE'&&x.referenceId===tx.referenceId&&!data!.transactions.some(y=>y.referenceId===x.id)):[tx];for(const g of group)reverseTransaction(data!,g.id);await persist();toast('Last action undone.');render()}catch(e){alert((e as Error).message)}});$('#history-filter')?.addEventListener('change',e=>{const f=(e.target as HTMLSelectElement).value;const ts=[...data!.transactions].reverse().filter(t=>f==='ALL'||t.type===f);$('#history-table').innerHTML=historyRows(ts)});document.querySelectorAll('[data-receipt]').forEach(e=>e.addEventListener('click',()=>{const tx=data!.transactions.find(x=>x.id===(e as HTMLElement).dataset.receipt);if(!tx)return;const group=tx.referenceId?data!.transactions.filter(x=>x.type==='SALE'&&x.referenceId===tx.referenceId):[tx];const items=group.map(g=>{const p=data!.products.find(x=>x.id===g.productId);return{productId:g.productId,qty:-g.quantityChange,price:g.salePrice??p?.sellingPrice??0}});showReceipt(buildCartReceipt(items,tx.timestamp))}));
document.querySelectorAll('[data-cart-add]').forEach(e=>e.addEventListener('click',()=>{const pid=(e as HTMLElement).dataset.cartAdd!;const p=data!.products.find(x=>x.id===pid);if(!p)return;const existing=cart.find(c=>c.productId===pid);if((existing?.qty||0)>=p.stock)return alert(t(data!,'notEnoughStock'));if(existing)existing.qty++;else cart.push({productId:pid,qty:1});render()}));
document.querySelectorAll('[data-cart-inc]').forEach(e=>e.addEventListener('click',()=>{const pid=(e as HTMLElement).dataset.cartInc!;const p=data!.products.find(x=>x.id===pid);const c=cart.find(x=>x.productId===pid);if(!p||!c)return;if(c.qty>=p.stock)return alert(t(data!,'notEnoughStock'));c.qty++;render()}));
document.querySelectorAll('[data-cart-dec]').forEach(e=>e.addEventListener('click',()=>{const pid=(e as HTMLElement).dataset.cartDec!;const c=cart.find(x=>x.productId===pid);if(!c)return;c.qty--;if(c.qty<=0)cart=cart.filter(x=>x.productId!==pid);render()}));
document.querySelectorAll('[data-cart-remove]').forEach(e=>e.addEventListener('click',()=>{const pid=(e as HTMLElement).dataset.cartRemove!;cart=cart.filter(x=>x.productId!==pid);render()}));
$('#clear-cart')?.addEventListener('click',()=>{cart=[];render()});
$('#checkout')?.addEventListener('click',checkout);$('#export')?.addEventListener('click',exportStore);$('#backup-now')?.addEventListener('click',exportStore);$('#csv-products')?.addEventListener('click',()=>csvExport('products'));$('#csv-sales')?.addEventListener('click',()=>csvExport('sales'));$('#csv-movement')?.addEventListener('click',()=>csvExport('movement'));$('#import-file')?.addEventListener('change',e=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)importStore(f)});$('#csv-import-file')?.addEventListener('change',e=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)importCsv(f)});document.querySelectorAll('[data-page]').forEach(x=>x.addEventListener('click',()=>{const next=(x as HTMLElement).dataset.page!;if(next!==page){query='';if(page==='customers')stopSyncPolling()}page=next;render()}));$('#categories')?.addEventListener('click',categoryManager);$('#suppliers')?.addEventListener('click',supplierManager);$('#session')?.addEventListener('click',sessions);$('#add-customer')?.addEventListener('click',addCustomerModal);document.querySelectorAll('[data-pay]').forEach(e=>e.addEventListener('click',()=>paymentModal((e as HTMLElement).dataset.pay!)));document.querySelectorAll('[data-ledger]').forEach(e=>e.addEventListener('click',()=>ledgerModal((e as HTMLElement).dataset.ledger!)));document.querySelectorAll('[data-subtab-inv]').forEach(e=>e.addEventListener('click',()=>{inventorySub=(e as HTMLElement).dataset.subtabInv as any;query='';render()}));document.querySelectorAll('[data-subtab-misc]').forEach(e=>e.addEventListener('click',()=>{if(miscSub==='online')stopSyncPolling();miscSub=(e as HTMLElement).dataset.subtabMisc as any;render()}));document.querySelectorAll('[data-calc]').forEach(e=>e.addEventListener('click',()=>handleCalc((e as HTMLElement).dataset.calc!)));$('#notes-text')?.addEventListener('input',e=>{data!.settings.notes=(e.target as HTMLTextAreaElement).value;clearTimeout(notesTimer);notesTimer=setTimeout(()=>persist(),600)});
$('#license-form')?.addEventListener('submit',async e=>{e.preventDefault();const key=String(new FormData(e.target as HTMLFormElement).get('key')||'').trim();const r=await verifyLicenseKey(key);if(!r.valid){alert(r.expired?t(data!,'licenseExpired'):(r.error||t(data!,'licenseInvalid')));return}data!.settings.license={key,tier:r.payload!.tier,expiresAt:r.payload!.expiresAt};await persist();toast(t(data!,'licenseActivated'));render()});
$('#create-sync')?.addEventListener('click',async()=>{data!.settings.syncCode=generateSyncCode();data!.settings.syncRole='';await persist();render()});
$('#join-sync-form')?.addEventListener('submit',async e=>{e.preventDefault();const code=String(new FormData(e.target as HTMLFormElement).get('code')||'').trim();if(!/^\d{6}$/.test(code))return alert(t(data!,'syncCodeInvalid'));data!.settings.syncCode=code;data!.settings.syncRole='';await persist();render()});
$('#leave-sync')?.addEventListener('click',async()=>{stopSyncPolling();stopScannerMode();delete data!.settings.syncCode;delete data!.settings.syncRole;await persist();render()});
$('#role-scanner')?.addEventListener('click',async()=>{stopSyncPolling();data!.settings.syncRole='scanner';await persist();render()});
$('#role-display')?.addEventListener('click',async()=>{stopScannerMode();data!.settings.syncRole='display';await persist();render()});
$('#start-scanning')?.addEventListener('click',()=>{const code=String(data!.settings.syncCode||'');if(code)startScannerMode(code)});
if(page==='customers'&&miscSub==='online'&&data!.settings.syncRole==='display'&&data!.settings.syncCode)startSyncPolling(String(data!.settings.syncCode));
}
function render(){if(!data)return;if(locked)return lockScreen();let content=page==='home'?home():page==='sales'?sales():page==='products'?inventoryPage():page==='customers'?miscPage():page==='history'?history():page==='reports'?reports():backup();if(page==='home')content+=`<section class="section card"><h2>${t(data,'storeTools')} ${tip(t(data,'tipStoreTools'))}</h2><div class="actions"><button class="secondary" data-page="reports">${t(data,'reports')}</button><button class="secondary" id="categories">${t(data,'categories')}</button><button class="secondary" id="suppliers">${t(data,'suppliers')}</button><button class="secondary" id="session">${data.sessions.some(s=>!s.closedAt)?t(data,'closeStore'):t(data,'openStore')}</button></div></section>`;layout(content);bind()}
async function start(){try{data=await load();if(data){if(!data.settings)data.settings={};if(!data.settings.theme)data.settings.theme='system';if(!data.settings.accent)data.settings.accent='#166534';applyAppearance();locked=Boolean(data.settings.pin)}if(!data){const m=modal('Welcome to Lightweight IMS',`<form class="form"><p>Simple, offline-first inventory for your store.</p><label>Store Name<input name="name" required autofocus placeholder="Maria's Sari-Sari Store"></label><label>Language<select name="lang"><option value="en" selected>English</option><option value="fil">Filipino</option></select></label><button class="primary">START MY STORE</button></form>`);m.querySelector('form')!.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.target as HTMLFormElement);data=initialStore(String(f.get('name')),f.get('lang') as 'en'|'fil');applyAppearance();try{await save(data);m.remove();render()}catch(err){alert((err as Error).message)}});return}render();maybeNotify()}catch(e){$('#app').innerHTML=`<main class="container"><div class="card"><h1>Could not load the store</h1><p>We could not open your local store data. Please keep your .store backup safe.</p><p class="muted">${esc(String(e))}</p></div></main>`}}
start();
if('serviceWorker' in navigator){
  let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload()});
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}
