var CACHE_NAME='dubaival-v28';
var PRECACHE=[
  '/logo.png',
  '/manifest.json',
  '/js/data-residential.js?v=20260629b',
  '/js/data-commercial.js?v=20260629b',
  '/js/valuation-db.js?v=20260623',
  '/js/valuation.js?v=20260623',
  '/js/api.js?v=20260630i',
  '/js/core.js?v=20260705c',
  '/js/auth.js?v=20260703c',
  '/js/inbox.js?v=20260704b',
  '/js/app.js?v=20260704p',
  '/js/market.js?v=20260703d',
  '/js/mortgage.js?v=20260629b',
  '/js/portfolio.js?v=20260703f',
  '/js/map.js?v=20260704a',
  '/js/deals.js?v=20260704c',
  '/js/chat.js?v=20260705a',
  '/js/social.js?v=20260701e',
  '/js/about.js?v=20260705a',
  '/js/workspace.js?v=20260703c',
  '/js/marketindex.js?v=20260703c',
  '/js/news.js?v=20260705e',
  '/js/chiefs.js?v=20260704a'
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
