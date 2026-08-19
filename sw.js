/* 何切る道場 - サービスワーカー(オフライン対応)
   v2: ネットワーク優先方式に変更。オンライン時は常に最新版を取得し、
   オフライン時のみキャッシュにフォールバックする。
   これにより index.html を更新するたびに本ファイルのバージョンを
   上げる必要がなくなる。 */
const CACHE_NAME = 'nanikiru-dojo-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // ネットワーク優先: オンラインなら常に最新を取得し、キャッシュを更新する。
  // オフライン時のみキャッシュから返す。
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (req.url.startsWith(self.location.origin) && res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
