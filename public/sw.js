const CACHE="lightweight-ims-v1.3.3";
const ASSETS=["/","/index.html","/manifest.webmanifest","/icon.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("lightweight-ims-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const isNavigation=e.request.mode==="navigate"||(e.request.headers.get("accept")||"").includes("text/html");
  if(isNavigation){
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(x=>x||caches.match("/index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request).then(x=>x||fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c));return r})));
});
