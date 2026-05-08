const CACHE = 'matbaa-expert-v2';
const ASSETS = [
  '/matbaa-expert/',
  '/matbaa-expert/index.html',
  '/matbaa-expert/manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700;900&display=swap'
];

// Kurulum — dosyaları cache'e al
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Aktivasyon — eski cache'leri temizle ve hemen devral
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — index.html için önce network, diğerleri cache-first
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHtml = url.pathname.endsWith('/') || url.pathname.endsWith('.html');

  if (isHtml) {
    // HTML: her zaman network'ten al, başarısız olursa cache
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // Diğerleri: cache-first
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone));
          }
          return res;
        }).catch(() => caches.match('/matbaa-expert/index.html'));
      })
    );
  }
});
