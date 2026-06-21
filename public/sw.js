const CACHE_NAME = "mtg-portal-v1";
const DATA_URLS = [
  "/data/analysis.json",
  "/data/availability.json",
  "/data/price_history.json",
  "/data/meta.json",
  "/manifest.json",
];

// Install: cache core files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(DATA_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first for data, cache fallback
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  
  // For data files, try network first, fall back to cache
  if (url.pathname.startsWith("/data/")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For everything else, stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Listen for data update notifications from the page
self.addEventListener("message", (event) => {
  if (event.data?.type === "DATA_UPDATED") {
    // Notify all clients about the update
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: "NEW_DATA_AVAILABLE", data: event.data.data });
      });
    });

    // Show push notification
    const count = event.data.data?.newCards || 0;
    self.registration.showNotification("📊 MTG Portal Updated", {
      body: count > 0
        ? `${count} new cards available in stock!`
        : "Scanner data has been refreshed",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [200, 100, 200],
      tag: "mtg-data-update",
      renotify: true,
    });
  }
});
