// Emanet — kod rehberi: arama kutusunda "ETH" yazınca "Ethereum" çıkması için kod + ad listesi (data/symbols.json).
// Günde bir kez yenilenir (dosya 20 saatten yeniyse hiçbir şey yapmaz). Bir kaynak çalışmazsa o türün önceki listesi korunur.
// Kaynaklar: BIST ve ABD hisseleri → TradingView tarayıcı listesi · fonlar → TEFAS · kripto → CoinGecko (yedek: Binance).
import fs from "node:fs/promises";

const OUT = "data/symbols.json";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const prev = await fs.readFile(OUT, "utf8").then(JSON.parse).catch(() => ({}));
const force = process.argv.includes("--force");
if (!force && prev.updatedAt && Date.now() - Date.parse(prev.updatedAt) < 20 * 3600e3 && ["hisse", "abd", "fon", "kripto"].every(k => (prev[k] || []).length)) {
  console.log("Kod rehberi güncel, atlandı."); process.exit(0);
}
async function j(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { "user-agent": UA, accept: "application/json,text/plain,*/*", ...(opts.headers || {}) }, signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error(new URL(url).hostname + " " + r.status);
  return r.json();
}
const clean = s => String(s || "").replace(/\s+/g, " ").trim();
const ok = s => /^[A-Z0-9.\-]{1,12}$/.test(s);
const out = { updatedAt: new Date().toISOString() };

async function tv(market, filter, sort, n) {
  const d = await j(`https://scanner.tradingview.com/${market}/scan`, {
    method: "POST", headers: { "content-type": "application/json", origin: "https://www.tradingview.com", referer: "https://www.tradingview.com/" },
    body: JSON.stringify({ columns: ["name", "description"], filter, sort, range: [0, n], options: { lang: "tr" } })
  });
  return (d.data || []).map(x => [clean(x.d?.[0]).toUpperCase(), clean(x.d?.[1])]).filter(([c, n]) => ok(c) && n);
}
const tasks = {
  // Borsa İstanbul: hisseler ve borsa yatırım fonları
  hisse: () => tv("turkey", [{ left: "exchange", operation: "equal", right: "BIST" }, { left: "type", operation: "in_range", right: ["stock", "fund", "dr"] }], { sortBy: "name", sortOrder: "asc" }, 1500),
  // ABD: piyasa değerine göre ilk 3000 (NASDAQ, NYSE, AMEX) + ETF'ler
  abd: async () => {
    const st = await tv("america", [{ left: "exchange", operation: "in_range", right: ["NASDAQ", "NYSE", "AMEX"] }, { left: "type", operation: "equal", right: "stock" }, { left: "is_primary", operation: "equal", right: true }], { sortBy: "market_cap_basic", sortOrder: "desc" }, 3000);
    await sleep(800);
    let etf = []; try { etf = await tv("america", [{ left: "type", operation: "equal", right: "fund" }, { left: "exchange", operation: "in_range", right: ["NASDAQ", "NYSE", "AMEX"] }], { sortBy: "volume", sortOrder: "desc" }, 600); } catch { }
    const seen = new Set(); return [...st, ...etf].filter(([c]) => !seen.has(c) && seen.add(c));
  },
  // TEFAS: tüm yatırım fonları (son iş günlerinden biri); para piyasası fonları ayrıca işaretlenir
  fon: async () => {
    for (let back = 0; back < 6; back++) {
      const d = new Date(Date.now() - back * 864e5), t = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
      try {
        const r = await fetch("https://www.tefas.gov.tr/api/DB/BindHistoryInfo", { method: "POST", signal: AbortSignal.timeout(25000),
          headers: { "user-agent": UA, "content-type": "application/x-www-form-urlencoded; charset=UTF-8", "x-requested-with": "XMLHttpRequest", origin: "https://www.tefas.gov.tr", referer: "https://www.tefas.gov.tr/TarihselVeriler.aspx" },
          body: new URLSearchParams({ fontip: "YAT", sfontur: "", fonkod: "", fongrup: "", bastarih: t, bittarih: t, fonturkod: "", fonunvantip: "" }) });
        if (!r.ok) throw new Error("TEFAS " + r.status);
        const rows = (await r.json()).data || [];
        if (rows.length > 100) return rows.map(x => [clean(x.FONKODU).toUpperCase(), clean(x.FONUNVAN)]).filter(([c, n]) => ok(c) && n);
      } catch (e) { console.log("TEFAS", t, e.message); }
      await sleep(1500);
    }
    // Yeni TEFAS (/api/funds/*): sitenin kendi betiklerinden uç adlarını bulup liste döndüreni dener
    const H = { "user-agent": UA, accept: "application/json, text/plain, */*", "content-type": "application/json", origin: "https://www.tefas.gov.tr", referer: "https://www.tefas.gov.tr/", "accept-language": "tr-TR,tr;q=0.9" };
    const html = await (await fetch("https://www.tefas.gov.tr/", { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) })).text();
    // Next.js: sayfadaki ve derleme listesindeki tüm parçaları tara; uç adları "fon...Getir" biçiminde
    const base = "https://www.tefas.gov.tr/", seen = new Set(), queue = [...html.matchAll(/["'(]((?:https:\/\/www\.tefas\.gov\.tr)?\/?_next\/static\/[^"'()\s]+?\.js)/g)].map(m => new URL(m[1], base).href);
    const names = new Set();
    while (queue.length && seen.size < 120) {
      const u = queue.shift(); if (seen.has(u)) continue; seen.add(u);
      try { const t = await (await fetch(u, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) })).text();
        for (const m of t.matchAll(/["'`]\/?(?:api\/)?funds\/([A-Za-z0-9]+)/g)) names.add(m[1]);
        for (const m of t.matchAll(/["'`](fon[A-Z][A-Za-z0-9]{3,40})["'`]/g)) names.add(m[1]);
        for (const m of t.matchAll(/["'(](?:\/)?(_next\/static\/[^"'()\s]+?\.js)/g)) { const x = new URL(m[1], base).href; if (!seen.has(x)) queue.push(x); }
        for (const m of t.matchAll(/["'](static\/chunks\/[^"']+?\.js)["']/g)) { const x = new URL("_next/" + m[1], base).href; if (!seen.has(x)) queue.push(x); }
      } catch { }
    }
    const srcs = [...seen];
    console.log("TEFAS ana sayfa:", html.length, "karakter ·", html.replace(/\s+/g, " ").slice(0, 160));
    ["fonListesiGetir", "fonListeGetir", "fonListesi", "tumFonlariGetir", "fonAramaGetir", "fonAra", "fonKarsilastirmaGetir", "fonGetiriBazliGetir", "fonUnvanListesiGetir", "fonKoduListesiGetir", "fonTurListesiGetir", "getiriBazliFonListesiGetir"].forEach(n => names.add(n));
    console.log("TEFAS uçları:", [...names].join(", ") || "(bulunamadı)", "· betik:", srcs.length);
    const cand = [...names].sort((a, b) => (/list|tum|ara|search|fonlar|unvan|karsilas/i.test(b) ? 1 : 0) - (/list|tum|ara|search|fonlar|unvan|karsilas/i.test(a) ? 1 : 0)).slice(0, 14);
    for (const n of cand) {
      for (const body of [{ dil: "TR" }, { dil: "TR", fonTipi: "YAT" }, { dil: "TR", fonTurKod: "", fonTipi: "YAT", sFonTur: "" }]) {
        try {
          const r = await fetch("https://www.tefas.gov.tr/api/funds/" + n, { method: "POST", headers: H, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
          const tx = await r.text(); let d; try { d = JSON.parse(tx); } catch { console.log(" ", n, r.status, "json değil"); break; }
          const rows = Array.isArray(d) ? d : d?.resultList || d?.data || [];
          console.log(" ", n, r.status, JSON.stringify(body), "→", Array.isArray(rows) ? rows.length + " satır " + JSON.stringify(rows[0] || {}).slice(0, 160) : typeof rows);
          if (Array.isArray(rows) && rows.length > 100) {
            const kc = Object.keys(rows[0]).find(k => /kod|code/i.test(k)), kn = Object.keys(rows[0]).find(k => /unvan|ad|name|title/i.test(k) && k !== kc);
            if (kc && kn) return rows.map(x => [clean(x[kc]).toUpperCase(), clean(x[kn])]).filter(([c, n]) => ok(c) && n);
          }
        } catch (e) { console.log(" ", n, e.message); }
        await sleep(1200);
      }
    }
    throw new Error("TEFAS listesi alınamadı");
  },
  // Kripto: piyasa değerine göre ilk 500
  kripto: async () => {
    try {
      const a = [];
      for (const page of [1, 2]) { a.push(...await j(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}`)); await sleep(2500); }
      const seen = new Set();
      return a.map(x => [clean(x.symbol).toUpperCase(), clean(x.name)]).filter(([c, n]) => ok(c) && n && !seen.has(c) && seen.add(c));
    } catch (e) {
      console.log("CoinGecko:", e.message, "→ Binance");
      const d = await j("https://api.binance.com/api/v3/exchangeInfo?permissions=SPOT");
      const seen = new Set();
      return (d.symbols || []).filter(s => s.quoteAsset === "USDT" && s.status === "TRADING").map(s => [s.baseAsset, s.baseAsset]).filter(([c]) => ok(c) && !seen.has(c) && seen.add(c));
    }
  }
};
for (const [k, fn] of Object.entries(tasks)) {
  try { const l = await fn(); if (l.length < 20) throw new Error("çok az kayıt: " + l.length); out[k] = l; console.log(`${k}: ${l.length} kod (ör. ${l.slice(0, 3).map(x => x.join(" ")).join(", ")})`); }
  catch (e) { out[k] = prev[k] || []; console.log(`${k} alınamadı (${e.message}); önceki liste korundu (${out[k].length})`); }
  await sleep(600);
}
await fs.writeFile(OUT, JSON.stringify(out) + "\n");
