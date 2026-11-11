/* Emanet servis çalışanı: çevrimiçiyken her zaman en güncel dosyayı alır, çevrimdışıyken önbellekten açar. */
const V = "emanet-v17";
const SHELL = ["./", "index.html", "css/base.css", "css/theme.css", "js/config.js", "js/vendor/supabase.js", "js/app.js",
  "fonts/plus-jakarta-sans-latin.woff2", "fonts/plus-jakarta-sans-latin-ext.woff2", "icons/icon.svg", "manifest.webmanifest", "data/ufe.json", "data/market.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  const key = url.origin + url.pathname;
  e.respondWith((async () => {
    const cache = await caches.open(V);
    try {
      const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error("zaman aşımı")), 6000))]);
      if (res && res.ok) cache.put(key, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(key) || (req.mode === "navigate" ? await cache.match(new URL("index.html", self.registration.scope).href) : null);
      if (hit) return hit;
      throw err;
    }
  })());
});
