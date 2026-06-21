var CACHE_NAME='dubaival-v3';
var PRECACHE=[
  '/',
  '/index.html',
  '/logo.png',
  '/js/data-residential.js',
  '/js/valuation.js',
  '/js/api.js',
  '/js/core.js',
  '/js/auth.js',
  '/js/app.js',
  '/js/market.js',
  '/js/mortgage.js',
  '/js/portfolio.js',
  '/js/map.js',
  '/js/deals.js',
  '/js/chat.js',
  '/js/about.js',
  '/js/workspace.js',
  '/js/marketindex.js',
  '/manifest.json'
];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(PRECACHE);
    }).then(function(){return self.skipWaiting();})
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(n){return n!==CACHE_NAME;})
          .map(function(n){return caches.delete(n);})
      );
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch',function(e){
  var url=new URL(e.request.url);
  // Skip API calls and external requests — network only
  if(url.pathname.startsWith('/api/')||url.origin!==self.location.origin){
    // For fonts/CDN: cache-first
    if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'||url.hostname==='unpkg.com'){
      e.respondWith(
        caches.match(e.request).then(function(r){
          return r||fetch(e.request).then(function(resp){
            var clone=resp.clone();
            caches.open(CACHE_NAME).then(function(c){c.put(e.request,clone);});
            return resp;
          });
        })
      );
      return;
    }
    return;
  }
  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r||fetch(e.request).then(function(resp){
        if(resp.status===200){
          var clone=resp.clone();
          caches.open(CACHE_NAME).then(function(c){c.put(e.request,clone);});
        }
        return resp;
      });
    }).catch(function(){
      if(e.request.mode==='navigate')return caches.match('/');
    })
  );
});
