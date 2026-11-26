const prefix='ym-graduasi-'+new URL(self.registration.scope).pathname+'-',cacheName=prefix+'v3';
const assets=['./','index.html','style.css','config.js','app.js','uploads.js','windows.js','manifest.webmanifest','assets/gunung.jpg','assets/icon192.png','assets/icon512.png',...['biru','maroon'].flatMap(c=>['potret','landskap'].map(o=>'assets/'+c+'-'+o+'.png'))];
self.addEventListener('install',e=>e.waitUntil(caches.open(cacheName).then(c=>c.addAll(assets)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(prefix)&&k!==cacheName).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;
 e.respondWith((async()=>{
  const c=await caches.open(cacheName);
  if(new URL(e.request.url).pathname.endsWith('/config.js')){
   try{const fresh=await fetch(e.request,{cache:'no-store'});if(fresh.ok){await c.put(e.request,fresh.clone());return fresh}}catch{}
  }
  return await c.match(e.request)||fetch(e.request);
 })());
});
