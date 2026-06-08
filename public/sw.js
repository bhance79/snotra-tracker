const CACHE_NAME = 'snotra-v2'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['/manifest.json'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Always fetch HTML fresh — cached index.html causes stale asset references after deploys
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')))
    return
  }

  // Hashed assets (JS/CSS/images) are immutable — cache-first
  if (url.pathname.startsWith('/assets/') || url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return res
        })
      })
    )
    return
  }

  // Everything else — network first, fall back to cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
