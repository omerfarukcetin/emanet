/* Emanet servis çalışanı: çevrimiçiyken her zaman en güncel dosyayı alır, çevrimdışıyken önbellekten açar. */
const V = "emanet-v20";
const NC = "emanet-notif";   // gün sonu bildirimi için cihazda tutulan küçük kayıt; sürüm değişince silinmez
const SHELL = ["./", "index.html", "css/base.css", "css/theme.css", "js/config.js", "js/vendor/supabase.js", "js/app.js",
  "fonts/plus-jakarta-sans-latin.woff2", "fonts/plus-jakarta-sans-latin-ext.woff2", "icons/icon.svg", "manifest.webmanifest", "data/ufe.json", "data/market.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== NC).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
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

/* ---------- gün sonu bildirimi ----------
   Sunucudan içi boş bir uyandırma gelir. Günlük kâr/zarar burada, uygulamanın bu cihaza bıraktığı kayıt
   (miktarlar ve fiyat kaynakları) ile güncel fiyat dosyasından hesaplanır; tutarlar cihazdan çıkmaz. */
const nkey = k => new URL("__notif/" + k, self.registration.scope).href;
const nget = async k => { try { const r = await (await caches.open(NC)).match(nkey(k)); return r ? await r.json() : null; } catch (e) { return null; } };
const nput = async (k, v) => { try { await (await caches.open(NC)).put(nkey(k), new Response(JSON.stringify(v), { headers: { "content-type": "application/json" } })); } catch (e) {} };
const isoToday = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const dayGap = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 864e5);
const tl = v => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v);
const pct = v => "%" + new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));
async function dayNote(test) {
  let title = "Emanet · Gün sonu", body = "Günlük özetiniz hazır. Görmek için dokunun.", open = self.registration.scope;
  try {
    const snap = await nget("snap");
    if (snap && snap.pfs && snap.pfs.length) {
      open = snap.open || open;
      let mk = null;
      if (snap.auto !== false) for (const u of snap.urls || []) {
        try { const r = await fetch(u + (u.includes("?") ? "&" : "?") + "t=" + Math.floor(Date.now() / 6e4), { cache: "no-store" }); if (r.ok) { const d = await r.json(); if (d && d.updatedAt) { mk = d; break; } } } catch (e) {}
      }
      const fx = c => c === "TRY" ? 1 : (mk && mk.fx && +mk.fx[c] > 0 ? +mk.fx[c] : +(snap.rates || {})[c] || 0);
      const unit = h => {
        let p = 0;
        if (mk) {
          if (h.g && mk.gold && +mk.gold[h.g] > 0) p = +mk.gold[h.g];
          else if (h.k && mk.quotes) for (const k of h.k) { const q = mk.quotes[k]; if (q && +q.p > 0 && (!q.cur || q.cur === h.cur)) { p = +q.p; break; } }
        }
        return (p || +h.last || 0) * fx(h.cur);
      };
      const today = isoToday(), close = await nget("close");
      // Karşılaştırma günü: bu cihazın bir önceki gün sonu kaydı ya da uygulamanın son açıldığı gün; hangisi yeniyse
      let ref = close && close.d < today ? close : null;
      if (snap.ref && snap.ref.d < today && (!ref || snap.ref.d > ref.d)) ref = snap.ref;
      const now = {}, lines = [];
      for (const p of snap.pfs) {
        let v = 0, pl = 0, b = 0;
        for (const h of p.hs) {
          const u = unit(h); now[h.id] = u; v += h.q * u;
          const u0 = ref ? (+ref.u[h.id] || (h.buy && h.buy > ref.d ? +h.cu : 0)) : 0;
          if (u0 > 0 && u > 0) { pl += h.q * (u - u0); b += h.q * u0; }
        }
        lines.push({ n: p.n, main: p.main, v, has: b > 0, chg: b > 0 ? (pl >= 0 ? "▲ " : "▼ ") + (snap.hide ? "" : tl(Math.abs(pl)) + " · ") + pct(pl / b * 100) : "" });
      }
      const m = lines.find(l => l.main) || lines[0], rest = lines.filter(l => l !== m && l.has);
      const gap = ref ? dayGap(ref.d, today) : 0;
      if (m.has) {
        title = (gap > 3 ? "Son " + gap + " gün " : "Bugün ") + m.chg;
        body = [m.n + (snap.hide ? "" : " · " + tl(m.v)), ...rest.map(l => l.n + ": " + l.chg)].join("\n");
      } else {
        body = (snap.hide ? m.n : m.n + " · " + tl(m.v)) + "\nGünlük değişim yarından itibaren hesaplanır.";
      }
      if (!test) await nput("close", { d: today, u: now });
    }
  } catch (e) {}
  if (test) title = "Deneme · " + title;
  await self.registration.showNotification(title, { body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: "gun-sonu", renotify: true, data: { open } });
}
self.addEventListener("push", e => e.waitUntil(dayNote(false)));
self.addEventListener("message", e => { if (e.data && e.data.type === "gun-sonu") e.waitUntil(dayNote(!!e.data.test)); });
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.open) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { const c = cs.find(x => x.url.startsWith(self.registration.scope)); return c ? c.focus() : self.clients.openWindow(url); }));
});
