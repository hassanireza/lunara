// Lunara service worker.
//  - Pages (navigations): network first, so a new deploy is picked up immediately; cached copy when offline.
//  - Built assets (hashed, immutable): cache first. React runs from these bundled files, so the whole app works offline after the first visit.
// Scope-relative, so it works under any base path (e.g. /lunara/).
const VERSION = 'v1';
const SHELL = `lunara-shell-${VERSION}`;
const scope = self.registration.scope;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll([scope, `${scope}manifest.webmanifest`, `${scope}icon-192.png`])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cache = await caches.open(SHELL);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match(scope)) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (request.mode === 'navigate') return event.respondWith(networkFirst(request));
  if (url.pathname.includes('/assets/') || /\.(png|svg|woff2?)$/.test(url.pathname)) return event.respondWith(cacheFirst(request));
  event.respondWith(networkFirst(request));
});
