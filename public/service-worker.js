// キルスイッチSW: 自分自身を登録解除し、すべてのキャッシュを削除する
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch (err) {}
    try { await self.registration.unregister(); } catch (err) {}
    try {
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach(c => c.navigate(c.url));
    } catch (err) {}
  })());
});
