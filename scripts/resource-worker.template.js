/* Generated per build. Cache only this game's listed assets within its own scope. */
const CACHE = 'hulan-resources-__VERSION__';
const ROOT = new URL(self.registration.scope);
const PATHS = new Set(__PATHS__);
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.origin !== ROOT.origin ||
    !url.pathname.startsWith(ROOT.pathname)
  )
    return;
  const path = decodeURIComponent(url.pathname.slice(ROOT.pathname.length));
  const key =
    event.request.mode === 'navigate' && (path === '' || path === 'index.html')
      ? 'index.html'
      : path;
  if (!PATHS.has(key)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(new URL(key, ROOT).href);
      // Online visits must see a newly deployed app, not remain pinned to an old HTML shell.
      if (event.request.mode === 'navigate') {
        try {
          const response = await fetch(event.request);
          return response.ok ? response : hit || response;
        } catch (error) {
          if (hit) return hit;
          throw error;
        }
      }
      return hit || fetch(event.request);
    })(),
  );
});
