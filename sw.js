/* Emanet servis çalışanı: çevrimiçiyken her zaman en güncel dosyayı alır, çevrimdışıyken önbellekten açar. */
const V = "emanet-v46";
const NC = "emanet-notif";   // gün sonu bildirimi için cihazda tutulan küçük kayıt; sürüm değişince silinmez
const SHELL = ["./", "index.html", "css/base.css", "css/theme.css", "js/config.js", "js/vendor/supabase.js", "js/app.js",
  "fonts/plus-jakarta-sans-latin.woff2", "fonts/plus-jakarta-sans-latin-ext.woff2", "icons/icon.svg", "icons/badge-96.png", "manifest.webmanifest", "data/ufe.json", "data/tufe.json", "data/market.json"];
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
const sg = v => v >= 0 ? "+" : "−";
const sp = v => sg(v) + pct(v);                       // +%0,52
const dot = (v, has) => !has || Math.abs(v) < 0.005 ? "⚪" : v > 0 ? "🟢" : "🔴";
/* bildirimin büyük görseli (Android'de bildirim açılınca görünür): en çok yükselen ve düşenler, yeşil/kırmızı çubuklarla.
   "Tutarları gizle" açıksa yalnızca yüzde yazar; değilse tutar da yazar. Çizilemezse bildirim görselsiz gider. */
async function chartImg(head, sub, items, up, amt) {
  try {
    if (typeof OffscreenCanvas === "undefined" || !items || items.length < 2) return undefined;
    const W = 720, H = 360, c = new OffscreenCanvas(W, H), x = c.getContext("2d");
    const F = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", G = "#3ccf8e", R = "#ff6b5e", M = "#a3acc4";
    x.fillStyle = "#24272c"; x.fillRect(0, 0, W, H);
    x.textBaseline = "alphabetic"; x.textAlign = "left";
    x.fillStyle = up == null ? "#ffffff" : up ? G : R;
    if (amt) { x.font = "800 52px " + F; x.fillText(amt, 32, 80); const w = x.measureText(amt).width; x.font = "700 30px " + F; x.fillText(head, 32 + w + 18, 80); }
    else { x.font = "800 54px " + F; x.fillText(head, 32, 82); }
    x.fillStyle = M; x.font = "500 23px " + F; x.fillText(sub, 32, 118, W - 64);
    const ls = items.slice(0, 6), top = 146, rh = (H - top - 16) / ls.length, mx = Math.max(...ls.map(i => Math.abs(i.p)), 0.01);
    const money = !!amt && ls.some(i => i.d != null), L0 = 200, L1 = W - (money ? 262 : 150), bh = Math.min(26, rh * 0.56);
    ls.forEach((it, i) => {
      const y = top + i * rh + rh / 2, w = Math.max(6, (L1 - L0) * Math.abs(it.p) / mx), col = it.p >= 0 ? G : R;
      x.fillStyle = "#ffffff"; x.font = "700 24px " + F; x.textBaseline = "middle"; x.fillText(String(it.n).slice(0, 16), 32, y, L0 - 44);
      x.fillStyle = "rgba(255,255,255,.07)"; x.beginPath(); x.roundRect ? x.roundRect(L0, y - bh / 2, L1 - L0, bh, bh / 2) : x.rect(L0, y - bh / 2, L1 - L0, bh); x.fill();
      x.fillStyle = col; x.beginPath(); x.roundRect ? x.roundRect(L0, y - bh / 2, w, bh, bh / 2) : x.rect(L0, y - bh / 2, w, bh); x.fill();
      x.textAlign = "right";
      if (money && it.d != null) { x.font = "800 23px " + F; x.fillText(sp(it.p), W - 32, y); const pw = x.measureText(sp(it.p)).width; x.font = "600 21px " + F; x.fillStyle = "rgba(255,255,255,.78)"; x.fillText(sg(it.d) + tl(Math.abs(it.d)), W - 32 - pw - 14, y); }
      else { x.font = "800 24px " + F; x.fillText(sp(it.p), W - 32, y); }
      x.textAlign = "left";
    });
    const buf = new Uint8Array(await (await c.convertToBlob({ type: "image/png" })).arrayBuffer());
    let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return "data:image/png;base64," + btoa(bin);
  } catch (e) { return undefined; }
}
const movers = mv => { const a = mv.filter(x => isFinite(x.p) && Math.abs(x.p) >= 0.005).sort((p, q) => q.p - p.p); return a.length <= 5 ? a : a.slice(0, 3).concat(a.slice(-2)); };
async function notify(kindForced, test) {
  const notes = [], show = (tag, title, body, open, img) => notes.push([tag, (test ? "Deneme · " : "") + title, body, open, img]);
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
      let v = 0, pl = 0, b = 0, top = null; const mv = [];
      for (const h of p.hs) {
        const u = now[h.id]; v += h.q * u;
        const u0 = ref ? (+ref.u[h.id] || (h.buy && h.buy > ref.d ? +h.cu : 0)) : 0;
        if (u0 > 0 && u > 0) { const d = h.q * (u - u0); pl += d; b += h.q * u0; if (!top || Math.abs(d) > Math.abs(top.d)) top = { d, n: h.n, p: (u / u0 - 1) * 100 }; mv.push({ n: h.n, p: (u / u0 - 1) * 100, d }); }
      }
      const has = b > 0, pc = has ? pl / b * 100 : 0;
      return { n: p.n, main: p.main, v, has, pl, pc, b, top, mv, chg: has ? (snap.hide ? sp(pc) : sg(pl) + tl(Math.abs(pl)) + " (" + sp(pc) + ")") : "" };
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
    const alertNote = (a, p) => show("alarm-" + a.id, "🔔 " + a.n + " " + pn(a.v) + " " + a.cur + (a.op === "gte" ? " üstüne çıktı" : " altına indi"), "Şu an " + pn(p) + " " + a.cur, open);
    const due = t => T.hm >= P.t && st[t] !== today;
    // bütçe: ayda her kategori için %80 ve %100 eşiğinde birer kez
    const ym = today.slice(0, 7), bst = st.bud && st.bud.ym === ym ? st.bud : { ym, lv: {} };
    const bstep = p => p >= 100 ? 100 : p >= 80 ? 80 : 0;
    const budNew = () => (snap.bud || []).filter(x => bstep(x.p) > (bst.lv[x.c] || 0));
    const when = g => g <= 0 ? "bugün" : g === 1 ? "yarın" : g + " gün sonra";
    let kinds = kindForced ? [kindForced] : [];
    if (!kindForced) {
      if (P.d && due("daily") && (P.we || (T.dow >= 1 && T.dow <= 5))) kinds.push("daily");
      if (P.ps && snap.pfs.length > 1 && due("pfs") && (P.we || (T.dow >= 1 && T.dow <= 5))) kinds.push("pfs");
      // gün içi özetler: saati gelmiş (en fazla 2 saat geçmiş) ve bugün gönderilmemiş saatler; birden çoğu birikmişse tek bildirim
      const tsDue = (Array.isArray(P.ts) ? P.ts : []).filter(s => T.hm >= s && st["ts:" + s] !== today && (+T.hm.slice(0, 2) * 60 + +T.hm.slice(3)) - (+s.slice(0, 2) * 60 + +s.slice(3)) <= 120);
      if (tsDue.length && (P.we || (T.dow >= 1 && T.dow <= 5)) && !kinds.includes("daily")) { kinds.push("pulse"); if (!test) tsDue.forEach(s => { st["ts:" + s] = today; }); }
      if (P.w && due("weekly") && T.dow === 5) kinds.push("weekly");
      if (P.m && due("monthly") && T.lastDay) kinds.push("monthly");
      if (P.zk !== false && snap.zk && snap.zk.d && due("zakat") && [7, 1, 0].includes(dayGap(today, snap.zk.d))) kinds.push("zakat");
      if (P.dv !== false && (snap.dues || []).some(x => [3, 1, 0].includes(dayGap(today, x.d))) && due("vade")) kinds.push("vade");
      if (P.bu !== false && T.hm >= "08:00" && T.hm <= "23:30" && budNew().length) kinds.push("butce");
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
          if (m.has) show("hareket", (m.pl >= 0 ? "📈 " : "📉 ") + "Portföy " + (gap > 3 ? "son " + gap + " günde " : "bugün ") + (m.pl >= 0 ? "yükseldi " : "düştü ") + m.chg, [val(m), m.top ? "En çok etkileyen: " + m.top.n + " " + arrow(m.top.p) + pct(m.top.p) : ""].filter(Boolean).join("\n"), open, await chartImg((m.pl >= 0 ? "+" : "−") + pct(m.pc), m.n + " · " + (gap > 3 ? "son " + gap + " gün" : "bugün"), movers(m.mv), m.pl >= 0, snap.hide ? undefined : sg(m.pl) + tl(Math.abs(m.pl))));
          else show("hareket", "Portföyde büyük hareket", val(m) + "\nAyrıntı için dokunun.", open);
        } else if (m.has) {
          // gün sonu: başlıkta ana portföyün değişimi; altında toplam değer, en çok yükselen/düşen ve (portföy özeti ayrı değilse) diğer portföyler
          const mv = m.mv.filter(x => isFinite(x.p)).sort((a, b) => b.p - a.p), up = mv[0], dn = mv[mv.length - 1];
          const lines = [];
          if (!snap.hide) lines.push("Toplam değer " + tl(m.v));
          if (up && up.p > 0.005) lines.push("En çok yükselen  " + up.n + " " + sp(up.p));
          if (dn && dn.p < -0.005 && dn !== up) lines.push("En çok düşen  " + dn.n + " " + sp(dn.p));
          if (!P.ps && rest.length) lines.push(...rest.map(l => dot(l.pc, l.has) + " " + l.n + "  " + l.chg));
          show("gun-sonu", (m.pl >= 0 ? "📈 " : "📉 ") + m.n + (gap > 3 ? " son " + gap + " günde " : " bugün ") + m.chg, lines.join("\n") || val(m), open, await chartImg((m.pl >= 0 ? "+" : "−") + pct(m.pc), m.n + " · " + (gap > 3 ? "son " + gap + " gün" : "gün sonu"), movers(m.mv), m.pl >= 0, snap.hide ? undefined : sg(m.pl) + tl(Math.abs(m.pl))));
        } else show("gun-sonu", "Emanet · Gün sonu", val(m) + "\nGünlük değişim yarından itibaren hesaplanır.", open);
      }
      if (kind === "pfs") {
        // tüm portföylerin günlük değişimi tek bildirimde, her portföy bir satır
        const ls = since(dref), gap = dref ? dayGap(dref.d, today) : 0, hs = ls.filter(l => l.has);
        const pl = hs.reduce((a, l) => a + l.pl, 0), base = hs.reduce((a, l) => a + l.b, 0), pc = base ? pl / base * 100 : 0;
        const when = gap > 3 ? "son " + gap + " günde" : "bugün";
        if (hs.length) show("portfoyler", "📊 Portföyler " + when + " " + (snap.hide ? sp(pc) : sg(pl) + tl(Math.abs(pl)) + " (" + sp(pc) + ")"),
          ls.map(l => dot(l.pc, l.has) + " " + l.n + "  " + (l.has ? l.chg : "değişim yok")).join("\n") + (snap.hide ? "" : "\nToplam " + tl(ls.reduce((a, l) => a + l.v, 0))), open,
          await chartImg(sp(pc), "Portföyler · " + (gap > 3 ? "son " + gap + " gün" : "gün sonu"), ls.map(l => ({ n: l.n, p: l.has ? l.pc : 0, d: l.has ? l.pl : 0 })), pl >= 0, snap.hide ? undefined : sg(pl) + tl(Math.abs(pl))));
        else show("portfoyler", "📊 Portföyler", ls.map(l => l.n + (snap.hide ? "" : "  " + tl(l.v))).join("\n") + "\nGünlük değişim yarından itibaren hesaplanır.", open);
      }
      if (kind === "pulse") {
        const ls = since(dref), { m, rest } = pick(ls);
        const all = ls.flatMap(l => l.mv).filter(x => isFinite(x.p)).sort((a, b) => b.p - a.p), up = all[0], dn = all[all.length - 1];
        const lines = [val(m)];
        if (up && up.p > 0) lines.push("En çok yükselen  " + up.n + " " + sp(up.p));
        if (dn && dn.p < 0 && dn !== up) lines.push("En çok düşen  " + dn.n + " " + sp(dn.p));
        rest.slice(0, 3).forEach(l => lines.push(dot(l.pc, l.has) + " " + l.n + "  " + l.chg));
        show("gun-ici", (m.has ? (m.pl >= 0 ? "📈 " : "📉 ") : "") + "Portföy " + T.hm + (m.has ? " · " + m.chg : ""), lines.join("\n"), open, await chartImg(m.has ? (m.pl >= 0 ? "+" : "−") + pct(m.pc) : T.hm, (m.has ? m.n + " · saat " : "Saat ") + T.hm, movers(all), m.has ? m.pl >= 0 : null, m.has ? snap.hide ? undefined : sg(m.pl) + tl(Math.abs(m.pl)) : undefined));
      }
      if (kind === "weekly") {
        const ref = back(7, 5, 10), w = snap.per && snap.per.w;
        if (ref) { const { m, rest } = pick(since(ref)); show("haftalik", "🗓️ Bu hafta " + (m.has ? m.chg : ""), [val(m), ...rest.map(l => l.n + ": " + l.chg), dm(ref.d) + " – " + dm(today)].join("\n"), open, m.has ? await chartImg((m.pl >= 0 ? "+" : "−") + pct(m.pc), m.n + " · " + dm(ref.d) + " – " + dm(today), movers(m.mv), m.pl >= 0, snap.hide ? undefined : sg(m.pl) + tl(Math.abs(m.pl))) : undefined); }
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
        } else lines.push("Bu ay bütçe kaydı yok.");
        if (ref) { const { m } = pick(since(ref)); if (m.has) lines.push("Portföy bu ay " + m.chg); lines.push(val(m)); }
        else if (w) lines.push("Portföy bu ay " + arrow(w.pct) + pct(w.pct));
        show("aylik", "🗓️ " + title, lines.join("\n"), open);
      }
      if (kind === "zakat") {
        const z = snap.zk, g = z && z.d ? dayGap(today, z.d) : 7;
        const title = g <= 0 ? "Bugün zekât günü" : g === 1 ? "Yarın zekât günü" : "Zekât gününe " + g + " gün kaldı";
        const body = !z ? "Örnek bildirim. Zekât tarihiniz ayarlıysa gerçek tutar yazar." : z.reached ? (snap.hide ? "Hesaplanan zekâtı görmek için dokunun." : "Hesaplanan zekât: " + tl(z.left)) + "\nÖdediğinizde Zekât sekmesinden kaydedin." : "Varlıklarınız şu an nisabın altında; zekât düşmüyor.";
        show("zekat", "🌙 " + title, body, open.replace(/#.*$/, "") + "#zekat");
      }
      if (kind === "vade") {
        let ls = (snap.dues || []).filter(x => [3, 1, 0].includes(dayGap(today, x.d)));
        if (kindForced) ls = (snap.dues || []).slice(0, 3);
        const tx = x => x.n + " · " + (x.dir === "lent" ? "alacak" : "borç") + (snap.hide ? "" : " " + x.a) + " · " + when(dayGap(today, x.d));
        if (!ls.length) show("vade", "Vade yarın: Mehmet", "Örnek bildirim. Vadesi yaklaşan borç ya da alacak olunca gerçek kayıt yazar.", open.replace(/#.*$/, "") + "#borc");
        else show("vade", "📅 " + (ls.length === 1 ? "Vade " + when(dayGap(today, ls[0].d)) + ": " + ls[0].n : "Yaklaşan vadeler · " + ls.length + " kayıt"), ls.map(tx).join("\n"), open.replace(/#.*$/, "") + "#borc");
      }
      if (kind === "butce") {
        const ls = kindForced ? (snap.bud || []).slice(0, 3) : budNew();
        const tx = x => x.c + ": %" + x.p + (snap.hide ? "" : " · " + tl(x.s) + " / " + tl(x.b));
        if (!ls.length) show("butce", "Market bütçesi %85 doldu", "Örnek bildirim. Bir kategori bütçenin %80’ine ulaşınca gerçek tutar yazar.", open.replace(/#.*$/, "") + "#akis");
        else show("butce", "⚠️ " + (ls.length === 1 ? (ls[0].p >= 100 ? ls[0].c + " bütçesi aşıldı" : ls[0].c + " bütçesi %" + ls[0].p + " doldu") : "Bütçe uyarısı · " + ls.length + " kategori"), ls.map(tx).join("\n") + ((r => r > 0 ? "\nAyın bitmesine " + r + " gün var." : "\nBugün ayın son günü.")(new Date(+ym.slice(0, 4), +ym.slice(5), 0).getDate() - +today.slice(8))), open.replace(/#.*$/, "") + "#akis");
        if (!test) { (snap.bud || []).forEach(x => { bst.lv[x.c] = Math.max(bst.lv[x.c] || 0, bstep(x.p)); }); st.bud = bst; }
      }
      if (!test && kind !== "big" && kind !== "pulse") st[kind] = today;
    }
    if (!test) {
      closes = closes.filter(c => c.d !== today).concat([{ d: today, u: now }]).sort((a, b) => a.d.localeCompare(b.d)).slice(-45);
      await nput("closes", closes); await nput("st", st);
    }
  } catch (e) {}
  if (!notes.length) notes.push(["gun-sonu", (test ? "Deneme · " : "") + "Emanet", "Özetiniz hazır. Görmek için dokunun.", open]);
  const base = o => o.replace(/#.*$/, "");
  for (const [tag, title, body, o, img] of notes) await self.registration.showNotification(title, { body, icon: "icons/icon-192.png", badge: "icons/badge-96.png", tag, renotify: true, timestamp: Date.now(), data: { open: o, base: base(o) },
    ...(img ? { image: img } : {}),
    // Android'de bildirimin altında iki kısa yol
    actions: /^(gun-sonu|gun-ici|hareket|haftalik|aylik|portfoyler)$/.test(tag) ? [{ action: "portfoy", title: "Portföy" }, { action: "akis", title: "Bütçe" }] : [] });
}
self.addEventListener("push", e => e.waitUntil(notify(null, false)));
self.addEventListener("message", e => { if (e.data && e.data.type === "gun-sonu") e.waitUntil(notify(e.data.kind || "daily", !!e.data.test)); });
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const dt = e.notification.data || {}, url = e.action && dt.base ? dt.base + "#" + e.action : (dt.open || self.registration.scope);
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { const c = cs.find(x => x.url.startsWith(self.registration.scope)); if (!c) return self.clients.openWindow(url); return (url.includes("#") && c.navigate ? c.navigate(url).catch(() => c) : Promise.resolve(c)).then(w => (w || c).focus()); }));
});
