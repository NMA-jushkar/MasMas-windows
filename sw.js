// Offline cache for حضور و غیاب مس‌مس (windows v1.0.1)
const CACHE = "masmas-hozoor-windows-1.0.1-879780f5bf";
const ASSETS = ["./", "index.html", "app.js", "app.css", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "vazirmatn-arabic-400-normal.woff2", "vazirmatn-latin-400-normal.woff2", "vazirmatn-arabic-500-normal.woff2", "vazirmatn-latin-500-normal.woff2", "vazirmatn-arabic-700-normal.woff2", "vazirmatn-latin-700-normal.woff2", "vazirmatn-arabic-800-normal.woff2", "vazirmatn-latin-800-normal.woff2", "lalezar-arabic-400-normal.woff2", "lalezar-latin-400-normal.woff2"];
self.addEventListener("install", e => {
  // cache: "reload" skips the browser's HTTP cache, so an update never mixes old and new files
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache: "reload"})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("masmas-hozoor-windows-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => req.mode === "navigate" ? caches.match("index.html") : Response.error()))
  );
});
