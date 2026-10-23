// Caches map tiles in the browser so panning/zooming back over an area —
// or revisiting the site later — reuses what's already downloaded instead
// of re-fetching. OSM's tile servers send `cache-control: no-cache` (no
// normal HTTP caching at all), unlike every other asset on this site, which
// GitHub Pages already caches fine on its own. Bump CACHE_VERSION to
// invalidate everything at once if it's ever needed.
const CACHE_VERSION = 'v1';
const TILE_CACHE = `avant-apres-tiles-${CACHE_VERSION}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== TILE_CACHE).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

function isTileRequest(url) {
  return url.hostname === 'tile.openstreetmap.org';
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isTileRequest(url)) return;

  event.respondWith((async () => {
    const cache = await caches.open(TILE_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    // Leaflet's <img> tiles are plain cross-origin requests (no CORS mode),
    // so the response here is opaque — status/body aren't readable, but it
    // can still be cached and replayed as-is.
    if (response.ok || response.type === 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  })());
});
