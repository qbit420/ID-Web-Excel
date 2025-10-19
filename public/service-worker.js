// bump version on any file changes
const CACHE_NAME = "student-reg-v3";
const FILES_TO_CACHE = [
  "/",               // server routes this to student.html
  "/student.html",
  "/admin.html",     // page exists but server guards it with auth
  "/style.css",
  "/script.js",
  "/libs/exceljs.min.js",
  "/libs/FileSaver.min.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Cache-first for all GET requests
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((res) => {
          // refresh cache on success
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res.clone()));
          }
          return res;
        })
        .catch(() => cached); // offline → use cache

      return cached || fetchPromise;
    })
  );
});
