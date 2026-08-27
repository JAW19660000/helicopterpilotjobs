const CACHE_NAME = "hpj-cache-v5";
const CORE_ASSETS = ["styles.css", "counters.js", "icon-192.png", "icon-512.png", "index.html"];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(CORE_ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event) {
  var req = event.request;
  if (req.method !== "GET") return;

  if (req.mode === "navigate" || req.destination === "document") {
    // Always try the network first so listings stay current; fall back to
    // cache (or the homepage) only when offline.
    event.respondWith(
      fetch(req).catch(function(){
        return caches.match(req).then(function(r){ return r || caches.match("index.html"); });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function(cached){
      if (cached) return cached;
      return fetch(req).then(function(res){
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, resClone); });
        return res;
      });
    })
  );
});
