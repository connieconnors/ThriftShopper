// Beta: self-destruct — clears stale SW that caused reload loops on mobile.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))),
      self.registration.unregister(),
    ])
  );
});

self.addEventListener('fetch', () => {});
