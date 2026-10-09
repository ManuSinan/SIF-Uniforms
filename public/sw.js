const CACHE_NAME = "schoolfit-shell-v2";
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Some static assets failed to precache", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER cache API, auth, checkout, payments, or non-GET requests
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/checkout") ||
    url.pathname.includes("/payment") ||
    url.pathname.includes("/login") ||
    url.pathname.includes("/orders")
  ) {
    return;
  }

  // Stale-while-revalidate for static assets, network-first with offline fallback for navigation
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedOffline = await cache.match("/offline");
        return cachedOffline || new Response("Offline mode active. Please check your internet connection.", {
          headers: { "Content-Type": "text/html" }
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request);
    })
  );
});
