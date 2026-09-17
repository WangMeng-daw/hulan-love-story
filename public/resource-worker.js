/* Generated per build. Cache only this game's listed assets within its own scope. */
const CACHE = 'hulan-resources-7ae5f86a3b57dfdd';
const ROOT = new URL(self.registration.scope);
const PATHS = new Set(["cover/hulan-love-story.png","everyday-avatars.png","favicon.svg","letters/zhiyao-autumn.png","letters/zhiyao-spring.png","letters/zhiyao-summer.png","letters/zhiyao-winter.png","life-atlas.png","memories/memory-album-01.png","memories/memory-album-02.png","memories/memory-album-03.png","memories/memory-album-04.png","memories/memory-album-05.png","memories/memory-album-06.png","moments/everyday-01.png","moments/everyday-02.png","papers/household-register.png","papers/receipt-back.png","papers/receipt-front.png","papers/to-jianjun-1.png","papers/to-jianjun-2.png","papers/unfinished-zhiyao.png","rural-home.png","support/wechat-pay.png"]);
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
