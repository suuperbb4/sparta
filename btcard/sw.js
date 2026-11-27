// 비티 카드 서비스 워커: 앱 화면은 캐시, 카드 목록은 항상 최신 우선
const VERSION = 'btcard-v8';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'config.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // 카드·안내 이미지만 저장본 우선, 나머지(화면 파일·목록)는 항상 최신 우선 → 고친 내용이 바로 보인다
  const fresh = !/\.(jpe?g|png|webp|gif|svg)$/i.test(url.pathname);
  if (fresh) {
    // 네트워크 우선: 새 카드가 바로 보이게
    e.respondWith(
      fetch(e.request)
        .then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; })
        .catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
    return;
  }
  // 캐시 우선: 이미지와 앱 파일
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
      return r;
    }))
  );
});
