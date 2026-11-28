/* SPOON service worker: the app shell works offline. Bump V when you change any shell file. */
const V='spoon-v6';
const SHELL=['./','index.html','style.css','app.js','db.js','manifest.webmanifest','logo.png','icon-192.png','icon-512.png','apple-touch-icon.png','data/foods.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;          // never touch API calls (Open Food Facts etc.)
  if(u.pathname.includes('/data/packs'))return;                     // packs: plain network, the app stores them itself
  e.respondWith((async()=>{
    const c=await caches.open(V),hit=await c.match(r,{ignoreSearch:true});
    const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}                            // stale-while-revalidate
    return (await net)||(r.mode==='navigate'?c.match('index.html'):Response.error())})())});
