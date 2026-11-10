// Emanet — piyasa fiyatlarını çekip data/market.json dosyasına yazar.
// GitHub Actions bu betiği yarım saatte bir çalıştırır (.github/workflows/prices.yml).
// Kaynaklar: altın + döviz → finans.truncgil.com (yedek: altin.in) · hisse, ABD hissesi, kripto → Yahoo Finance · fonlar → TEFAS (/api/funds).
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
const GOLD_NAMES = { gram: ["GRA", "gram-altin", "Gram Altın"], ceyrek: ["CEYREKALTIN", "ceyrek-altin", "Çeyrek Altın"], yarim: ["YARIMALTIN", "yarim-altin", "Yarım Altın"], tam: ["TAMALTIN", "tam-altin", "Tam Altın"],
  cumhuriyet: ["CUMHURIYETALTINI", "cumhuriyet-altini", "Cumhuriyet Altını"], ata: ["ATAALTIN", "ata-altin", "Ata Altın"], resat: ["RESATALTIN", "resat-altin", "Reşat Altın"], hamit: ["HAMITALTIN", "hamit-altin", "Hamit Altın"], gumus: ["GUMUS", "gumus", "Gümüş"] };
const fold = s => String(s || "").toLocaleLowerCase("tr").replace(/[^a-z0-9çğıöşü]/g, "");

/** Yanıt yarıda kesilmiş olsa bile ("Unterminated string") tamamlanmış nesneleri kurtarır. */
function looseObjects(text) {
  try { return JSON.parse(text); } catch { /* aşağıda parça parça oku */ }
  const out = {};
  for (const m of text.matchAll(/"([^"]+)"\s*:\s*(\{[^{}]*\})/g)) { try { out[m[1]] = JSON.parse(m[2]); } catch { /* bozuk parça */ } }
  return out;
}
async function truncgil(url) {
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const d = looseObjects(await (await get(url)).text());
      const entries = Object.entries(d).filter(([, v]) => v && typeof v === "object");
      if (entries.length > 5) return entries;
      last = new Error("yanıt eksik");
    } catch (e) { last = e; }
    await sleep(1500 * (i + 1));
  }
  throw last;
}
/** altin.in ana sayfasından düz metin okuma (son yedek): "Reşat Altın 42.734,554 43.421,499" gibi satırlar. */
async function altinIn() {
  const html = await (await get("https://altin.in/", { headers: { accept: "text/html,*/*" } })).text();
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const N = "(\\d{1,3}(?:\\.\\d{3})*,\\d+|\\d+,\\d+)";
  const pick = label => { const m = text.match(new RegExp(label + "[^\\d]{0,40}" + N + "[^\\d]{1,25}" + N, "i")); return m ? { Buying: num(m[1]), Selling: num(m[2]) } : null; };
  const labels = { USD: "Dolar", EUR: "Euro", GRA: "Gram Altın", CEYREKALTIN: "Çeyrek(?: Altın)?", YARIMALTIN: "Yarım(?: Altın)?", TAMALTIN: "Tam Altın", CUMHURIYETALTINI: "Cumhuriyet(?: Altını)?", ATAALTIN: "Ata(?: Altın)?", RESATALTIN: "Reşat(?: Altın)?", HAMITALTIN: "Hamit(?: Altın)?", GUMUS: "Gümüş" };
  const entries = Object.entries(labels).map(([k, l]) => [k, pick(l)]).filter(([, v]) => v && v.Selling > 0 && v.Buying > 0 && v.Selling >= v.Buying * 0.97 && v.Selling <= v.Buying * 1.2);
  if (entries.length < 4) throw new Error("sayfa okunamadı");
  return entries;
}
async function goldAndFx(prev) {
  const fx = { ...(prev.fx || {}) }, gold = { ...(prev.gold || {}) };
  const sources = [["finans.truncgil.com", () => truncgil("https://finans.truncgil.com/v4/today.json")], ["finans.truncgil.com (v3)", () => truncgil("https://finans.truncgil.com/today.json")], ["altin.in", altinIn]];
  const fails = [];
  for (const [name, load] of sources) {
    let entries;
    try { entries = await load(); } catch (e) { fails.push(`${name}: ${e.message}`); continue; }
    const find = (...names) => { for (const n of names) { const hit = entries.find(([k, v]) => fold(k) === fold(n) || fold(v.Name) === fold(n)); if (hit) return hit[1]; } return null; };
    const buy = o => o ? num(o.Buying ?? o["Alış"] ?? o.buying) : NaN, sell = o => o ? num(o.Selling ?? o["Satış"] ?? o.selling) : NaN;
    const notes = [];
    const setFx = (c, o) => { const v = sell(o); if (sane(v, fx[c])) fx[c] = +v.toFixed(4); else if (o) notes.push(c + " kuru beklenmedik: " + v); };
    setFx("USD", find("USD", "Amerikan Doları")); setFx("EUR", find("EUR", "Euro"));
    let n = 0;
    for (const [k, names] of Object.entries(GOLD_NAMES)) {
      const o = find(...names), v = sell(o);
      if (sane(v, gold[k])) { gold[k] = +v.toFixed(2); n++; } else if (o) notes.push(`${k} fiyatı beklenmedik: ${v}`);
      if (k === "resat" && o) { const b = buy(o); if (sane(b, gold.resatAlis)) gold.resatAlis = +b.toFixed(2); if (sane(v, gold.resatSatis)) gold.resatSatis = +v.toFixed(2); }
    }
    if (n >= 3) { errors.push(...notes); if (fails.length) console.log("Altın yedek kaynağa düştü → " + fails.join(" | ")); return { fx, gold, source: name }; }
    fails.push(`${name}: altın fiyatları yanıtta yok`);
  }
  errors.push("Altın fiyatları alınamadı, önceki değerler korundu (" + fails.join("; ") + ")");
  // yalnızca döviz (Avrupa Merkez Bankası referans kuru)
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
// TEFAS Nisan 2026'da /api/DB/* uçlarını kaldırdı (404). Yeni uçlar /api/funds/* altında, JSON gövdeyle çalışır.
// Art arda birkaç istekten sonra 429 dönebildiği için istekler aralıklı gönderilir ve beklenip yeniden denenir.
let tefas429 = 0;
async function tefasPost(name, body) {
  let last;
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch("https://www.tefas.gov.tr/api/funds/" + name, { method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(12000),
        headers: { "user-agent": UA, accept: "application/json, text/plain, */*", "content-type": "application/json", origin: "https://www.tefas.gov.tr", referer: "https://www.tefas.gov.tr/", "accept-language": "tr-TR,tr;q=0.9" } });
      if (res.status === 429) { if (++tefas429 > 3) throw new Error("TEFAS istek sınırı (429)"); await sleep(46000); continue; }
      if (!res.ok) { last = new Error("TEFAS " + res.status); if (res.status === 404 || res.status === 403) break; await sleep(1000 * 2 ** i); continue; }
      const text = await res.text();
      try { return JSON.parse(text); } catch { last = new Error(/<html|Request Rejected/i.test(text) ? "TEFAS isteği reddetti" : "TEFAS bozuk yanıt"); }
    } catch (e) { last = e.name === "TimeoutError" ? new Error("TEFAS zaman aşımı") : e; }
    await sleep(1000 * 2 ** i);
  }
  throw last;
}
function parseDay(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number" || /^\d{10,13}$/.test(String(v))) { const n = +v; return new Date(n < 1e11 ? n * 1000 : n); }
  const s = String(v); let m;
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if ((m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/))) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  const d = new Date(s); return isNaN(d) ? null : d;
}
const rowsOf = d => Array.isArray(d) ? d : Array.isArray(d?.resultList) ? d.resultList : Array.isArray(d?.data) ? d.data : d?.resultList && typeof d.resultList === "object" ? [d.resultList] : [];
const field = (r, re) => { const k = Object.keys(r || {}).find(k => re.test(k)); return k ? r[k] : undefined; };
async function tefas(code) {
  const d = await tefasPost("fonFiyatBilgiGetir", { fonKodu: code, dil: "TR", periyod: 1 });
  const rows = rowsOf(d).map((r, i) => ({ p: num(field(r, /^fiyat$/i) ?? field(r, /fiyat|price/i)), d: parseDay(field(r, /tarih|date/i)), i })).filter(r => r.p > 0);
  if (rows.length) {
    const dated = rows.filter(r => r.d).sort((a, b) => b.d - a.d);
    const best = dated[0] || rows[rows.length - 1];
    return { p: best.p, cur: "TRY", t: (best.d || new Date()).toISOString().slice(0, 10) };
  }
  // yedek: fon özet bilgisi içindeki son fiyat
  await sleep(1100);
  const info = await tefasPost("fonBilgiGetir", { fonKodu: code, dil: "TR" });
  for (const r of rowsOf(info)) { const p = num(field(r, /^sonFiyat$/i) ?? field(r, /sonfiyat|fiyat/i)); if (p > 0) return { p, cur: "TRY", t: new Date().toISOString().slice(0, 10) }; }
  throw new Error(d?.errorMessage ? "TEFAS: " + d.errorMessage : "fon bulunamadı");
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
  let fail = 0, row = 0;
  for (const it of funds) {
    const key = it.kind + ":" + it.symbol;
    try {
      const q = await tefas(it.symbol);
      if (sane(q.p, quotes[key]?.p)) { quotes[key] = { p: +q.p.toFixed(6), cur: "TRY", t: q.t }; sources.add("TEFAS"); }
      else errors.push(`${it.symbol}: fon fiyatı önceki değerden çok farklı (${q.p}), kaydedilmedi`);
      row = 0;
    } catch (e) {
      fail++; errors.push(`${it.symbol}: fon fiyatı alınamadı (${e.message})`);
      if (++row >= 3) { errors.push("TEFAS art arda yanıt vermedi; kalan fonlar bu turda atlandı"); break; }
    }
    await sleep(1200);
  }
  if (fail && fail === funds.length) errors.push("TEFAS'a ulaşılamadı; fon fiyatlarını uygulamada elle girebilirsiniz");
}

const next = { fx, gold, quotes, source: [...sources].join(", "), errors };
const same = JSON.stringify({ ...prev, updatedAt: undefined }) === JSON.stringify({ updatedAt: undefined, ...next });
if (same) { console.log("Değişiklik yok."); }
else {
  await fs.writeFile(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), ...next }, null, 1) + "\n");
  console.log(`Yazıldı: ${Object.keys(quotes).length} kod, USD ${fx.USD}, gram altın ${gold.gram}`);
}
if (errors.length) console.log("Notlar:\n- " + errors.join("\n- "));
