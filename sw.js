const CACHE_NAME='korean-flashcards-v4.9.5';
const CORE=['./','./index.html','./style.css','./app.js','./data.js','./login.html','./login-style.css','./login.js','./login-korea.png','./manifest.webmanifest'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE).catch(()=>null))
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;

  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  // Navigation/JS/CSS/JSON: network first so an installed iPhone PWA
  // does not remain pinned to the previous release.
  const isFreshAsset =
    request.mode==='navigate' ||
    /\.(?:js|css|json|webmanifest)$/i.test(url.pathname) ||
    url.pathname.endsWith('/');

  if(isFreshAsset){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(request,{cache:'no-store'});
        const cache=await caches.open(CACHE_NAME);
        if(fresh.ok)cache.put(request,fresh.clone()).catch(()=>{});
        return fresh;
      }catch(error){
        const cached=await caches.match(request,{ignoreSearch:true});
        if(cached)return cached;
        if(request.mode==='navigate'){
          const fallback=await caches.match('./index.html');
          if(fallback)return fallback;
        }
        throw error;
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    const fresh=await fetch(request);
    const cache=await caches.open(CACHE_NAME);
    if(fresh.ok)cache.put(request,fresh.clone()).catch(()=>{});
    return fresh;
  })());
});
