const CACHE = 'matbaa-expert-v14';
const ASSETS = [
  '/matbaa-expert/',
  '/matbaa-expert/index.html',
  '/matbaa-expert/manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700;900&display=swap'
];

// Kurulum
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Aktivasyon — eski cache'leri temizle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // data.json — HER ZAMAN network'ten al, asla cache'leme
  if (url.pathname.includes('data.json')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).catch(() => new Response('{}'))
    );
    return;
  }

  // HTML — önce network, yoksa cache
  if (url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Diğerleri — cache-first
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
});
