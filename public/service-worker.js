// 静的アセットのみキャッシュ。HTML/JSはNetwork-First方針(常に最新を取得)
const CACHE_NAME = "toi-suite-v3";
const ASSETS = ["/manifest.json", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/favicon.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE_NAME).map(x => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // ナビゲーション(HTML)とJS/CSSは常にネットワーク優先(古いキャッシュを返さない)
  if (e.request.mode === "navigate" || /\.(js|css|html)$/.test(url.pathname)) {
    e.respondWith(fetch(e.request).catch(() => caches.match("/index.html")));
    return;
  }
  // 画像等の静的アセットはキャッシュ優先
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)));
});
