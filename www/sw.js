var CACHE_NAME='dubaival-v89';
var PRECACHE=[
  '/logo.png',
  '/manifest.json',
  '/js/data-residential.js?v=20260728c',
  '/js/data-commercial.js?v=20260629b',
  '/js/valuation-db.js?v=20260623',
  '/js/valuation.js?v=20260727b',
  '/js/api.js?v=20260727b',
  '/js/core.js?v=20260727a',
  '/js/auth.js?v=20260703c',
  '/js/inbox.js?v=20260704b',
  '/js/app.js?v=20260726b',
  '/js/market.js?v=20260727e',
  '/js/mortgage.js?v=20260629b',
  '/js/portfolio.js?v=20260726a',
  '/js/map.js?v=20260706b',
  '/js/deals.js?v=20260708b',
  '/js/chat.js?v=20260721a',
  '/js/social.js?v=20260706b',
  '/js/about.js?v=20260724c',
  '/js/workspace.js?v=20260711b',
  '/js/marketindex.js?v=20260726a',
  '/js/news.js?v=20260709a',
  '/js/chiefs.js?v=20260711b'
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

  // Skip API calls — always network
  if(url.pathname.startsWith('/api/')){return;}

  // External requests: fonts/CDN — cache-first
  if(url.origin!==self.location.origin){
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
    }
    return;
  }

  // HTML navigation — network-first (always get latest index.html)
  if(e.request.mode==='navigate'||url.pathname.endsWith('.html')||url.pathname==='/'){
    e.respondWith(
      fetch(e.request).then(function(resp){
        if(resp.status===200){
          var clone=resp.clone();
          caches.open(CACHE_NAME).then(function(c){c.put(e.request,clone);});
        }
        return resp;
      }).catch(function(){
        return caches.match(e.request).then(function(r){return r||caches.match('/');});
      })
    );
    return;
  }

  // JS/CSS/images with ?v= version param — cache-first (immutable)
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r||fetch(e.request).then(function(resp){
        if(resp.status===200){
          var clone=resp.clone();
          caches.open(CACHE_NAME).then(function(c){c.put(e.request,clone);});
        }
        return resp;
      });
    }).catch(function(){return caches.match('/');})
  );
});
