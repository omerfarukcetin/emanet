/* Emanet servis çalışanı: çevrimiçiyken her zaman en güncel dosyayı alır, çevrimdışıyken önbellekten açar. */
const V = "emanet-v38";
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

/* ---------- bildirimler ----------
   Sunucudan içi boş bir uyandırma gelir; hangi bildirimin gösterileceğine burada, cihazın kendi ayarlarına ve saatine
   bakılarak karar verilir. Metin, uygulamanın bu cihaza bıraktığı kayıt (miktarlar, fiyat kaynakları, ayarlar) ile
   güncel fiyat dosyasından hesaplanır; tutarlar cihazdan çıkmaz.
   Sıra: saati gelmiş özetler (gün sonu, cuma günü haftalık, ay sonunda aylık); hiçbiri değilse büyük hareket uyarısı. */
const nkey = k => new URL("__notif/" + k, self.registration.scope).href;
const nget = async k => { try { const r = await (await caches.open(NC)).match(nkey(k)); return r ? await r.json() : null; } catch (e) { return null; } };
const nput = async (k, v) => { try { await (await caches.open(NC)).put(nkey(k), new Response(JSON.stringify(v), { headers: { "content-type": "application/json" } })); } catch (e) {} };
const localNow = () => { const d = new Date(), l = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return { D: l.toISOString().slice(0, 10), hm: l.toISOString().slice(11, 16), dow: l.getUTCDay(), lastDay: new Date(l.getTime() + 864e5).getUTCMonth() !== l.getUTCMonth() }; };
const dayGap = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 864e5);
const tl = v => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v);
const pct = v => "%" + new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));
const dm = d => new Date(d + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
const arrow = v => v >= 0 ? "▲ " : "▼ ";
async function notify(kindForced, test) {
  const notes = [], show = (tag, title, body, open) => notes.push([tag, (test ? "Deneme · " : "") + title, body, open]);
  let open = self.registration.scope;
  try {
    const snap = await nget("snap");
    if (!snap || !snap.pfs || !snap.pfs.length) throw new Error("kayıt yok");
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
    const T = localNow(), today = T.D, P = Object.assign({ d: true, t: "18:30", we: false, w: false, m: false, bm: 0 }, snap.prefs || {});
    const st = (await nget("st")) || {};
    let closes = (await nget("closes")) || [];
    if (!closes.length) { const old = await nget("close"); if (old && old.d) closes = [old]; }
    const now = {}; snap.pfs.forEach(p => p.hs.forEach(h => { now[h.id] = unit(h); }));
    // bir referans güne göre her portföyün değişimi (yalnızca fiyat hareketi: bugünkü miktar × birim değer farkı)
    const since = ref => snap.pfs.map(p => {
      let v = 0, pl = 0, b = 0, top = null;
      for (const h of p.hs) {
        const u = now[h.id]; v += h.q * u;
        const u0 = ref ? (+ref.u[h.id] || (h.buy && h.buy > ref.d ? +h.cu : 0)) : 0;
        if (u0 > 0 && u > 0) { const d = h.q * (u - u0); pl += d; b += h.q * u0; if (!top || Math.abs(d) > Math.abs(top.d)) top = { d, n: h.n, p: (u / u0 - 1) * 100 }; }
      }
      const has = b > 0, pc = has ? pl / b * 100 : 0;
      return { n: p.n, main: p.main, v, has, pl, pc, top, chg: has ? arrow(pl) + (snap.hide ? "" : tl(Math.abs(pl)) + " · ") + pct(pc) : "" };
    });
    const pick = ls => ({ m: ls.find(l => l.main) || ls[0], rest: ls.filter(l => !l.main && l.has) });
    const val = m => m.n + (snap.hide ? "" : " · " + tl(m.v));
    // en yakın uygun geçmiş kayıt: hedef gün sayısı kadar eski olana en yakın
    const back = (target, min, max) => closes.filter(c => { const g = dayGap(c.d, today); return g >= min && g <= max; }).sort((a, b) => Math.abs(dayGap(a.d, today) - target) - Math.abs(dayGap(b.d, today) - target))[0] || null;

    // fiyat alarmları: sınır yeni aşıldıysa haber ver; fiyat geri dönünce alarm yeniden kurulur
    const price = k => { if (!mk) return 0; const i = k.indexOf(":"), a = k.slice(0, i), x = k.slice(i + 1); return a === "gold" ? +(mk.gold || {})[x] || 0 : a === "fx" ? +(mk.fx || {})[x] || 0 : +((mk.quotes || {})[x] || {}).p || 0; };
    const pn = v => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: v < 10 ? 4 : 2 }).format(v);
    const fired = st.al || (st.al = {}), hit = [], alerts = snap.alerts || [];
    for (const a of alerts) { const p = price(a.k); if (!(p > 0)) continue; const on = a.op === "gte" ? p >= a.v : p <= a.v; if (on && !fired[a.id]) hit.push([a, p]); else if (!on && fired[a.id]) delete fired[a.id]; }
    for (const id of Object.keys(fired)) if (!alerts.some(a => a.id === id)) delete fired[id];
    const alertNote = (a, p) => show("alarm-" + a.id, a.n + " " + pn(a.v) + " " + a.cur + (a.op === "gte" ? " üstüne çıktı" : " altına indi"), "Şu an " + pn(p) + " " + a.cur, open);
    const due = t => T.hm >= P.t && st[t] !== today;
    let kinds = kindForced ? [kindForced] : [];
    if (!kindForced) {
      if (P.d && due("daily") && (P.we || (T.dow >= 1 && T.dow <= 5))) kinds.push("daily");
      if (P.w && due("weekly") && T.dow === 5) kinds.push("weekly");
      if (P.m && due("monthly") && T.lastDay) kinds.push("monthly");
      if (hit.length) { hit.slice(0, 3).forEach(([a, p]) => { alertNote(a, p); fired[a.id] = today; }); }
      else if (!kinds.length && alerts.length && !(+P.bm > 0)) {
        // sunucu bir alarm için uyandırdı ama burada fiyat henüz sınırı göstermiyor: sınıra en yakın alarmı bildir
        const near = alerts.filter(a => !fired[a.id] && price(a.k) > 0).sort((x, y) => Math.abs(price(x.k) / x.v - 1) - Math.abs(price(y.k) / y.v - 1))[0];
        if (near && Math.abs(price(near.k) / near.v - 1) <= 0.005) { show("alarm-" + near.id, near.n + " " + pn(near.v) + " " + near.cur + " sınırında", "Şu an " + pn(price(near.k)) + " " + near.cur, open); fired[near.id] = today; }
      }
      if (!kinds.length && !notes.length) kinds.push(+P.bm > 0 ? "big" : "daily");
    }
    if (kindForced === "alert") {
      kinds = [];
      const a = alerts[0];
      if (a) show("alarm-" + a.id, a.n + " " + pn(a.v) + " " + a.cur + (a.op === "gte" ? " üstüne çıktı" : " altına indi"), "Şu an " + pn(price(a.k) || a.v) + " " + a.cur, open);
      else show("alarm", "Gram altın 7.000,00 TRY üstüne çıktı", "Örnek bildirim. Alarm kurduğunuzda gerçek fiyat yazar.", open);
    }
    // günlük karşılaştırma günü: bu cihazın dünkü kaydı ya da uygulamanın son açıldığı gün; hangisi yeniyse
    const prevClose = closes.filter(c => c.d < today).sort((a, b) => b.d.localeCompare(a.d))[0] || null;
    let dref = prevClose;
    if (snap.ref && snap.ref.d < today && (!dref || snap.ref.d > dref.d)) dref = snap.ref;
    for (const kind of kinds) {
      if (kind === "daily" || kind === "big") {
        const { m, rest } = pick(since(dref)), gap = dref ? dayGap(dref.d, today) : 0;
        if (kind === "big") {
          if (m.has) show("hareket", "Portföy " + (gap > 3 ? "son " + gap + " günde " : "bugün ") + (m.pl >= 0 ? "yükseldi " : "düştü ") + m.chg, [val(m), m.top ? "En çok etkileyen: " + m.top.n + " " + arrow(m.top.p) + pct(m.top.p) : ""].filter(Boolean).join("\n"), open);
          else show("hareket", "Portföyde büyük hareket", val(m) + "\nAyrıntı için dokunun.", open);
        } else if (m.has) show("gun-sonu", (gap > 3 ? "Son " + gap + " gün " : "Bugün ") + m.chg, [val(m), ...rest.map(l => l.n + ": " + l.chg)].join("\n"), open);
        else show("gun-sonu", "Emanet · Gün sonu", val(m) + "\nGünlük değişim yarından itibaren hesaplanır.", open);
      }
      if (kind === "weekly") {
        const ref = back(7, 5, 10), w = snap.per && snap.per.w;
        if (ref) { const { m, rest } = pick(since(ref)); show("haftalik", "Bu hafta " + (m.has ? m.chg : ""), [val(m), ...rest.map(l => l.n + ": " + l.chg), dm(ref.d) + " – " + dm(today)].join("\n"), open); }
        else if (w) { const { m } = pick(since(null)); show("haftalik", "Bu hafta " + arrow(w.pct) + pct(w.pct), [val(m), dm(w.from) + " – " + dm(today)].join("\n"), open); }
        else { const { m } = pick(since(null)); show("haftalik", "Emanet · Haftalık özet", val(m) + "\nHaftalık değişim için bir haftalık kayıt gerekiyor; gelecek cuma hazır olur.", open); }
      }
      if (kind === "monthly") {
        const ref = back(30, 20, 40), mo = snap.mon && snap.mon.ym === today.slice(0, 7) ? snap.mon : null, w = snap.per && snap.per.m;
        const lines = [];
        let title = (mo ? mo.n : "Ay") + " özeti";
        if (mo && (mo.i || mo.o)) {
          const rate = mo.i ? (mo.i - mo.o) / mo.i * 100 : null;
          if (rate != null) title += " · birikim %" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(rate);
          if (!snap.hide) lines.push("Gelir " + tl(mo.i) + " · Gider " + tl(mo.o) + " · Kalan " + tl(mo.i - mo.o));
        } else lines.push("Bu ay gelir-gider kaydı yok.");
        if (ref) { const { m } = pick(since(ref)); if (m.has) lines.push("Portföy bu ay " + m.chg); lines.push(val(m)); }
        else if (w) lines.push("Portföy bu ay " + arrow(w.pct) + pct(w.pct));
        show("aylik", title, lines.join("\n"), open);
      }
      if (!test && kind !== "big") st[kind] = today;
    }
    if (!test) {
      closes = closes.filter(c => c.d !== today).concat([{ d: today, u: now }]).sort((a, b) => a.d.localeCompare(b.d)).slice(-45);
      await nput("closes", closes); await nput("st", st);
    }
  } catch (e) {}
  if (!notes.length) notes.push(["gun-sonu", (test ? "Deneme · " : "") + "Emanet", "Özetiniz hazır. Görmek için dokunun.", open]);
  for (const [tag, title, body, o] of notes) await self.registration.showNotification(title, { body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag, renotify: true, data: { open: o } });
}
self.addEventListener("push", e => e.waitUntil(notify(null, false)));
self.addEventListener("message", e => { if (e.data && e.data.type === "gun-sonu") e.waitUntil(notify(e.data.kind || "daily", !!e.data.test)); });
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.open) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { const c = cs.find(x => x.url.startsWith(self.registration.scope)); return c ? c.focus() : self.clients.openWindow(url); }));
});
