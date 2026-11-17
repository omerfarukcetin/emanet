// Emanet — kod rehberi: arama kutusunda "ETH" yazınca "Ethereum" çıkması için kod + ad listesi (data/symbols.json).
// Günde bir kez yenilenir (dosya 20 saatten yeniyse hiçbir şey yapmaz). Bir kaynak çalışmazsa o türün önceki listesi korunur.
// Kaynaklar: BIST ve ABD hisseleri → TradingView tarayıcı listesi · kripto → CoinGecko (yedek: Binance).
import fs from "node:fs/promises";

const OUT = "data/symbols.json";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const prev = await fs.readFile(OUT, "utf8").then(JSON.parse).catch(() => ({}));
const force = process.argv.includes("--force");
if (!force && prev.updatedAt && Date.now() - Date.parse(prev.updatedAt) < 20 * 3600e3 && ["hisse", "abd", "kripto"].every(k => (prev[k] || []).length)) {
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
  // Fonlar: TEFAS'ın yeni sitesinde fon listesi veren açık bir uç yok (eski /api/DB/BindHistoryInfo 404, ana sayfa bot korumalı).
  // Bu yüzden fon adı listesi tutulmuyor; fon kodunu yazan kullanıcıya "yine de ekle" seçeneği sunuluyor.
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
