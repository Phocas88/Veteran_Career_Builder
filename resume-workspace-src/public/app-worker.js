/* Public installation support only. Private application data is never cached. */
'use strict';
const VERSION='20261105-install',scope=new URL(self.registration.scope),prefix='vcp-resume-install:'+scope.pathname+':',cacheName=prefix+VERSION;
const offline=new URL('./offline.html',scope).href;
const assets=['./offline.html','./app-install.css?v='+VERSION,'./app-icon-192.png','./app-icon-512.png','./app-icon-maskable-512.png','./apple-touch-icon.png'].map(file=>new URL(file,scope).href);
const publicAssets=new Set(assets);
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(cacheName);await cache.addAll(assets);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(prefix)&&key!==cacheName)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 if(publicAssets.has(url.href)){
  event.respondWith((async()=>{const cache=await caches.open(cacheName);return await cache.match(url.href)||fetch(request);})());return;
 }
 const relative=url.pathname.slice(scope.pathname.length);if(request.mode!=='navigate'||relative==='api'||relative.startsWith('api/'))return;
 event.respondWith(fetch(request).catch(async()=>{const cache=await caches.open(cacheName);return await cache.match(offline)||new Response('You are offline. Reconnect, then reload Veteran Resumes.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});}));
});
