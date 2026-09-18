// PJT 2610 여행 일정표 - 오프라인 캐시용 서비스워커
// 캐시 버전을 올리면(v1 -> v2) 예전 캐시는 자동 정리되고 새 파일로 교체됩니다.
const CACHE_NAME = 'pjt2610-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// stale-while-revalidate: 캐시가 있으면 즉시 보여주고, 백그라운드에서 최신 버전으로 갱신.
// 번역/음성(TTS) API 요청은 항상 실시간 네트워크가 필요하므로 캐시하지 않고 그대로 통과시킵니다.
self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  var url = event.request.url;
  if(url.indexOf(self.location.origin) !== 0) return; // 외부 API(번역/TTS 등)는 캐시 대상에서 제외

  event.respondWith(
    caches.match(event.request).then(function(cached){
      var fetchPromise = fetch(event.request).then(function(networkResp){
        if(networkResp && networkResp.status === 200){
          var clone = networkResp.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, clone); });
        }
        return networkResp;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
