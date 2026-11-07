const CACHE='juggler-counter-v20';
const LOCAL=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./data/juggler-specs.json','./icons/icon.svg'];
const SCOPE=new URL(self.registration.scope);
const KNOWN=new Set(LOCAL.map(path=>new URL(path,SCOPE).pathname));
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(LOCAL.map(path=>new Request(new URL(path,SCOPE),{cache:'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('juggler-counter-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
  if(!KNOWN.has(url.pathname)&&request.mode!=='navigate')return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(request,{cache:'no-store'});
      if(response.ok&&KNOWN.has(url.pathname)){
        event.waitUntil(cache.put(request,response.clone()));
      }
      return response;
    }catch(error){
      const fallback=await cache.match(request,{ignoreSearch:true});
      if(fallback)return fallback;
      if(request.mode==='navigate'){
        const shell=await cache.match(new URL('./index.html',SCOPE));
        if(shell)return shell;
      }
      return Response.error();
    }
  })());
});
