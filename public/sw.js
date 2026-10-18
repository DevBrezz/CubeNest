// Recovery worker: remove the previous offline cache that may serve stale/broken assets.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('devbrezz-portfolio-')).map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) client.navigate(client.url);
    } catch (error) {
      console.error('Offline cache recovery failed:', error);
    }
  })());
});
