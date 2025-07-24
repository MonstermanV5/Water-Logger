const CACHE_NAME = "hydration-helper-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/calendar.html",
  "/style.css",
  "/calendar.css",
  "/app.js",
  "/calendar.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});