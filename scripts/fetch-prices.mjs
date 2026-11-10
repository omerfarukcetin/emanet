// Emanet — piyasa fiyatlarını çekip data/market.json dosyasına yazar.
// GitHub Actions bu betiği yarım saatte bir çalıştırır (.github/workflows/prices.yml).
// Kaynaklar: altın + döviz → finans.truncgil.com · hisse, ABD hissesi, kripto → Yahoo Finance · fonlar → TEFAS.
// Bir kaynak yanıt vermezse o kalemin önceki değeri korunur ve "errors" listesine not düşülür.
import fs from "node:fs/promises";

const OUT = "data/market.json";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const errors = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const readJSON = async (p, d) => { try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return d; } };

/** "5.790,12" → 5790.12 ; 5790.12 → 5790.12 */
function num(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  if (v == null) return NaN;
  let s = String(v).replace(/[^\d.,-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
async function get(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { "user-agent": UA, accept: "application/json,text/plain,*/*", ...(opts.headers || {}) }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${new URL(url).hostname} ${res.status}`);
  return res;
}
/** Önceki değerden %40'tan fazla sapan değeri kabul etme (bozuk veri koruması). */
function sane(next, prev) { return next > 0 && (!(prev > 0) || Math.abs(next - prev) / prev <= 0.4); }

// ---------- izleme listesi ----------
async function watchlist() {
  const items = new Map();
  const add = (kind, symbol, cur) => {
    kind = String(kind || "").toLowerCase(); symbol = String(symbol || "").toUpperCase().trim();
    if (!/^[A-Z0-9.\-]{1,12}$/.test(symbol) || !["hisse", "abd", "fon", "ppf", "kripto", "diger"].includes(kind)) return;
    items.set(kind + ":" + symbol, { kind, symbol, cur: cur || (kind === "abd" || kind === "kripto" ? "USD" : "TRY") });
  };
  const local = await readJSON("data/watchlist.json", {});
  for (const k of local.kodlar || []) add(k.tur, k.kod, k.pb);
  // Giriş (Supabase) kuruluysa uygulamanın ortak izleme tablosunu oku
  const cfg = await fs.readFile("js/config.js", "utf8").catch(() => "");
  const url = (cfg.match(/supabaseUrl:\s*"([^"]+)"/) || [])[1], key = (cfg.match(/supabaseKey:\s*"([^"]+)"/) || [])[1];
  if (url && key) {
    try {
      const rows = await (await get(`${url.replace(/\/$/, "")}/rest/v1/emanet_watch?select=kind,symbol,cur&limit=1000`, { headers: { apikey: key, authorization: "Bearer " + key } })).json();
      for (const r of rows) add(r.kind, r.symbol, r.cur);
    } catch (e) { errors.push("İzleme listesi okunamadı: " + e.message); }
  }
  return [...items.values()];
}

// ---------- altın ve döviz ----------
async function goldAndFx(prev) {
  const fx = { ...(prev.fx || {}) }, gold = { ...(prev.gold || {}) };
  try {
    const d = await (await get("https://finans.truncgil.com/v4/today.json")).json();
    const fold = s => String(s || "").toLocaleLowerCase("tr").replace(/[^a-z0-9çğıöşü]/g, "");
    const entries = Object.entries(d).filter(([, v]) => v && typeof v === "object");
    const find = (...names) => { for (const n of names) { const hit = entries.find(([k, v]) => fold(k) === fold(n) || fold(v.Name) === fold(n)); if (hit) return hit[1]; } return null; };
    const buy = o => o ? num(o.Buying ?? o["Alış"] ?? o.buying) : NaN, sell = o => o ? num(o.Selling ?? o["Satış"] ?? o.selling) : NaN;
    const setFx = (c, o) => { const v = sell(o); if (sane(v, fx[c])) fx[c] = +v.toFixed(4); else if (o) errors.push(c + " kuru beklenmedik: " + v); };
    setFx("USD", find("USD", "Amerikan Doları")); setFx("EUR", find("EUR", "Euro"));
    const map = { gram: ["GRA", "gram-altin", "Gram Altın"], ceyrek: ["CEYREKALTIN", "ceyrek-altin", "Çeyrek Altın"], yarim: ["YARIMALTIN", "yarim-altin", "Yarım Altın"], tam: ["TAMALTIN", "tam-altin", "Tam Altın"],
      cumhuriyet: ["CUMHURIYETALTINI", "cumhuriyet-altini", "Cumhuriyet Altını"], ata: ["ATAALTIN", "ata-altin", "Ata Altın"], resat: ["RESATALTIN", "resat-altin", "Reşat Altın"], hamit: ["HAMITALTIN", "hamit-altin", "Hamit Altın"], gumus: ["GUMUS", "gumus", "Gümüş"] };
    let n = 0;
    for (const [k, names] of Object.entries(map)) {
      const o = find(...names), v = sell(o);
      if (sane(v, gold[k])) { gold[k] = +v.toFixed(2); n++; } else if (o) errors.push(`${k} altın fiyatı beklenmedik: ${v}`);
      if (k === "resat" && o) { const b = buy(o); if (sane(b, gold.resatAlis)) gold.resatAlis = +b.toFixed(2); if (sane(v, gold.resatSatis)) gold.resatSatis = +v.toFixed(2); }
    }
    if (!n) errors.push("Altın fiyatları yanıtta bulunamadı; önceki değerler korundu");
    return { fx, gold, source: "finans.truncgil.com" };
  } catch (e) {
    errors.push("Altın/döviz kaynağı yanıt vermedi (" + e.message + "); altın fiyatları korundu");
  }
  // yedek: yalnızca döviz (Avrupa Merkez Bankası referans kuru)
  try {
    const d = await (await get("https://api.frankfurter.dev/v1/latest?base=USD&symbols=TRY,EUR")).json();
    const usd = +d.rates.TRY, eur = usd / +d.rates.EUR;
    if (sane(usd, fx.USD)) fx.USD = +usd.toFixed(4);
    if (sane(eur, fx.EUR)) fx.EUR = +eur.toFixed(4);
  } catch (e) { errors.push("Yedek döviz kaynağı da yanıt vermedi (" + e.message + ")"); }
  return { fx, gold, source: "frankfurter.dev (yalnızca döviz)" };
}

// ---------- hisse, ABD hissesi, kripto: Yahoo Finance ----------
function yahooSymbol(it) {
  if (it.kind === "hisse") return it.symbol + ".IS";
  if (it.kind === "abd") return it.symbol.replace(/\./g, "-");
  if (it.kind === "kripto") return it.symbol + "-USD";
  return it.symbol;
}
async function yahoo(it) {
  const s = encodeURIComponent(yahooSymbol(it));
  let last;
  for (const host of ["query1", "query2"]) {
    try {
      const d = await (await get(`https://${host}.finance.yahoo.com/v8/finance/chart/${s}?interval=1d&range=1d`)).json();
      const m = d?.chart?.result?.[0]?.meta;
      if (m && m.regularMarketPrice > 0) return { p: +m.regularMarketPrice, cur: m.currency || it.cur, t: new Date((m.regularMarketTime || Date.now() / 1000) * 1000).toISOString() };
      last = new Error("fiyat yok");
    } catch (e) { last = e; }
    await sleep(400);
  }
  throw last;
}

// ---------- fonlar: TEFAS ----------
const trDate = d => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
async function tefasSession() {
  const res = await get("https://www.tefas.gov.tr/TarihselVeriler.aspx", { headers: { accept: "text/html,*/*" } });
  const cookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  return cookies.map(c => c.split(";")[0]).join("; ");
}
async function tefas(code, cookie) {
  const now = new Date(), from = new Date(now.getTime() - 12 * 864e5);
  for (const fontip of ["YAT", "EMK"]) {
    const body = new URLSearchParams({ fontip, sfontur: "", fonkod: code, fongrup: "", bastarih: trDate(from), bittarih: trDate(now), fonturkod: "", fonunvantip: "", strperiod: "1,1,1,1,1,1,1", islemdurum: "1" });
    const res = await get("https://www.tefas.gov.tr/api/DB/BindHistoryInfo", { method: "POST", body,
      headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8", "x-requested-with": "XMLHttpRequest", origin: "https://www.tefas.gov.tr", referer: "https://www.tefas.gov.tr/TarihselVeriler.aspx", cookie } });
    const text = await res.text();
    if (/Request Rejected/i.test(text)) throw new Error("TEFAS isteği reddetti");
    const rows = (JSON.parse(text).data || []).filter(r => num(r.FIYAT) > 0).sort((a, b) => +b.TARIH - +a.TARIH);
    if (rows.length) return { p: num(rows[0].FIYAT), cur: "TRY", t: new Date(+rows[0].TARIH).toISOString().slice(0, 10) };
  }
  throw new Error("fon bulunamadı");
}

// ---------- ana akış ----------
const prev = await readJSON(OUT, {});
const items = await watchlist();
const { fx, gold, source } = await goldAndFx(prev);
const quotes = { ...(prev.quotes || {}) };
const sources = new Set([source]);

const market = items.filter(i => !["fon", "ppf"].includes(i.kind)), funds = items.filter(i => ["fon", "ppf"].includes(i.kind));
for (const it of market) {
  const key = it.kind + ":" + it.symbol;
  try {
    const q = await yahoo(it);
    // kripto TL olarak izleniyorsa dolar fiyatını kurla çevir
    if (it.kind === "kripto" && it.cur === "TRY" && q.cur === "USD" && fx.USD > 0) { q.p = q.p * fx.USD; q.cur = "TRY"; }
    if (sane(q.p, quotes[key]?.cur === q.cur ? quotes[key].p : 0)) { quotes[key] = { p: +q.p.toFixed(q.p < 10 ? 4 : 2), cur: q.cur, t: q.t }; sources.add("Yahoo Finance"); }
    else errors.push(`${it.symbol}: fiyat önceki değerden çok farklı (${q.p}), kaydedilmedi`);
  } catch (e) { errors.push(`${it.symbol}: fiyat alınamadı (${e.message})`); }
  await sleep(350);
}
if (funds.length) {
  try {
    const cookie = await tefasSession();
    let fail = 0;
    for (const it of funds) {
      const key = it.kind + ":" + it.symbol;
      try {
        const q = await tefas(it.symbol, cookie);
        if (sane(q.p, quotes[key]?.p)) { quotes[key] = { p: +q.p.toFixed(6), cur: "TRY", t: q.t }; sources.add("TEFAS"); }
        else errors.push(`${it.symbol}: fon fiyatı önceki değerden çok farklı (${q.p}), kaydedilmedi`);
      } catch (e) { fail++; errors.push(`${it.symbol}: fon fiyatı alınamadı (${e.message})`); if (/reddetti/.test(e.message)) break; }
      await sleep(600);
    }
    if (fail === funds.length) errors.push("TEFAS'a ulaşılamadı; fon fiyatlarını uygulamada elle girebilirsiniz");
  } catch (e) { errors.push("TEFAS'a ulaşılamadı (" + e.message + "); fon fiyatları korundu"); }
}

const next = { fx, gold, quotes, source: [...sources].join(", "), errors };
const same = JSON.stringify({ ...prev, updatedAt: undefined }) === JSON.stringify({ updatedAt: undefined, ...next });
if (same) { console.log("Değişiklik yok."); }
else {
  await fs.writeFile(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), ...next }, null, 1) + "\n");
  console.log(`Yazıldı: ${Object.keys(quotes).length} kod, USD ${fx.USD}, gram altın ${gold.gram}`);
}
if (errors.length) console.log("Notlar:\n- " + errors.join("\n- "));
