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
  cumhuriyet: ["CUMHURIYETALTINI", "cumhuriyet-altini", "Cumhuriyet Altını"], ata: ["ATAALTIN", "ata-altin", "Ata Altın"], resat: ["RESATALTIN", "resat-altin", "Reşat Altın"], hamit: ["HAMITALTIN", "hamit-altin", "Hamit Altın"], gumus: ["GUMUS", "gumus", "Gümüş"],
  ayar22: ["YIA", "22-ayar-bilezik", "22 Ayar Bilezik"], ayar18: ["ONSEKIZAYARALTIN", "18-ayar-altin", "18 Ayar Altın"], ayar14: ["ONDORTAYARALTIN", "14-ayar-altin", "14 Ayar Altın"] };
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
/** Zekât nisabının dayandığı fiyat: altin.in/fiyat/resat-altin sayfasındaki Reşat altın ALIŞ fiyatı. */
function flexNum(t) {
  t = String(t || "").trim();
  if (t.includes(",")) return num(t);                       // 42.734,554
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) return +t.replace(/\./g, ""); // 42.734
  return parseFloat(t);                                     // 42734.5540
}
async function resatAltinIn(ref) {
  const html = await (await get("https://altin.in/fiyat/resat-altin", { headers: { accept: "text/html,*/*", "accept-language": "tr-TR,tr;q=0.9" } })).text();
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const N = "(\\d[\\d.,]{3,14}\\d)";
  const ok = (b, s) => b > 5000 && s >= b && s <= b * 1.15 && (!(ref > 0) || Math.abs(s - ref) / ref < 0.15);
  const tries = [];
  const mb = text.match(new RegExp("Al[ıi]ş[^\\d]{0,60}" + N, "i")), ms = text.match(new RegExp("Sat[ıi]ş[^\\d]{0,60}" + N, "i"));
  if (mb && ms) tries.push([flexNum(mb[1]), flexNum(ms[1])]);
  for (const m of text.matchAll(new RegExp(N + "[^\\d]{1,40}" + N, "g"))) tries.push([flexNum(m[1]), flexNum(m[2])]);
  for (const [b, s] of tries) if (ok(b, s)) return { buy: b, sell: s };
  throw new Error("sayfada Reşat alış fiyatı bulunamadı");
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
    if (n >= 3) {
      errors.push(...notes); if (fails.length) console.log("Altın yedek kaynağa düştü → " + fails.join(" | "));
      let src = name;
      try {
        const r = await resatAltinIn(gold.resat);
        gold.resatAlis = +r.buy.toFixed(2); gold.resatSatis = +r.sell.toFixed(2); gold.resatKaynak = "altin.in";
        if (name !== "altin.in") src = name + ", altin.in (Reşat alış)";
      } catch (e) { gold.resatKaynak = name; errors.push("Reşat alış fiyatı altin.in'den okunamadı (" + e.message + "); nisap için " + name + " fiyatı kullanıldı"); }
      return { fx, gold, source: src };
    }
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
      if (m && m.regularMarketPrice > 0) return { p: +m.regularMarketPrice, pc: +(m.chartPreviousClose || m.previousClose) || 0, cur: m.currency || it.cur, t: new Date((m.regularMarketTime || Date.now() / 1000) * 1000).toISOString() };
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
    const best = dated[0] || rows[rows.length - 1], prevRow = dated[1];
    return { p: best.p, pc: prevRow ? prevRow.p : 0, cur: "TRY", t: (best.d || new Date()).toISOString().slice(0, 10) };
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
    if (sane(q.p, quotes[key]?.cur === q.cur ? quotes[key].p : 0)) { quotes[key] = { p: +q.p.toFixed(q.p < 10 ? 4 : 2), cur: q.cur, t: q.t, ...(q.pc > 0 ? { pc: +q.pc.toFixed(q.pc < 10 ? 4 : 2) } : {}) }; sources.add("Yahoo Finance"); }
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
      if (sane(q.p, quotes[key]?.p)) { quotes[key] = { p: +q.p.toFixed(6), cur: "TRY", t: q.t, ...(q.pc > 0 ? { pc: +q.pc.toFixed(6) } : {}) }; sources.add("TEFAS"); }
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

// ---------- karşılaştırma serileri: günlük kapanışlar (data/bench.json) ----------
// Uygulamadaki "getiri karşılaştırması" bu dosyayı okur: BIST 100, dolar, euro, ons altın ve gümüş (USD), S&P 500 (USD).
// Her seri için ilk çalışmada iki yıllık geçmiş alınır, sonra yalnızca son günler eklenir. Alınamayan seriye dokunulmaz.
{
  const BF = "data/bench.json", B = await readJSON(BF, {}), out = { ...B };
  const SERIES = [["xu100", "XU100.IS"], ["usd", "USDTRY=X"], ["eur", "EURTRY=X"], ["xau", "GC=F"], ["xag", "SI=F"], ["spx", "^GSPC"]];
  let changed = false;
  for (const [key, sym] of SERIES) {
    try {
      const cur = { ...(B[key] || {}) }, range = Object.keys(cur).length < 200 ? "2y" : "5d";
      let d = null;
      for (const host of ["query1", "query2"]) {
        try { d = (await (await get(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=${range}`)).json())?.chart?.result?.[0]; if (d) break; } catch { /* diğer sunucuyu dene */ }
        await sleep(400);
      }
      const ts = d?.timestamp || [], cl = d?.indicators?.quote?.[0]?.close || [];
      let n = 0;
      ts.forEach((t, i) => { const v = +cl[i]; if (v > 0) { cur[new Date((t + 3 * 3600) * 1000).toISOString().slice(0, 10)] = +v.toFixed(4); n++; } });
      const m = d?.meta;
      if (m && m.regularMarketPrice > 0) { cur[new Date(((m.regularMarketTime || Date.now() / 1000) + 3 * 3600) * 1000).toISOString().slice(0, 10)] = +(+m.regularMarketPrice).toFixed(4); n++; }
      if (!n) throw new Error("veri yok");
      const keys = Object.keys(cur).sort().slice(-1600), o = {};
      for (const k of keys) o[k] = cur[k];
      if (JSON.stringify(o) !== JSON.stringify(B[key] || {})) { out[key] = o; changed = true; console.log(`${key}: ${keys.length} gün (son ${keys[keys.length - 1]}: ${o[keys[keys.length - 1]]})`); }
    } catch (e) { console.log(`${key} alınamadı: ${e.message}`); }
    await sleep(300);
  }
  if (changed) { out.updatedAt = new Date().toISOString(); await fs.writeFile(BF, JSON.stringify(out) + "\n"); }
}

// ---------- varlık karnesi: teknik göstergeler (data/tech.json) ----------
// Her izlenen varlığın son bir yıllık günlük kapanışlarından hesaplanır; günde bir kez yenilenir.
// Uygulama bu özetten sade cümleler üretir. Yatırım tavsiyesi değildir; yalnızca geçmiş fiyat hareketinin özeti.
{
  const TF = "data/tech.json", T = await readJSON(TF, {}), DAY = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
  const B = await readJSON("data/bench.json", {}), out = { v: 1, s: { ...(T.s || {}) } };
  const keys = [], want = new Set();
  for (const it of items) if (["hisse", "abd", "fon", "ppf", "kripto"].includes(it.kind)) { const k = it.kind + ":" + it.symbol; if (!want.has(k)) { want.add(k); keys.push({ k, it }); } }
  for (const k of ["gold:gram", "gold:gumus", "fx:USD", "fx:EUR"]) { want.add(k); keys.push({ k }); }
  for (const k of Object.keys(out.s)) if (!want.has(k)) delete out.s[k];
  const benchSeries = k => {
    const u = B.usd || {}, pick = (src, f) => Object.keys(src).sort().map(d => { const v = f(d); return v > 0 ? [d, v] : null; }).filter(Boolean);
    if (k === "gold:gram") return pick(B.xau || {}, d => (B.xau[d] && u[d]) ? B.xau[d] * u[d] / 31.1035 : 0);
    if (k === "gold:gumus") return pick(B.xag || {}, d => (B.xag[d] && u[d]) ? B.xag[d] * u[d] / 31.1035 : 0);
    if (k === "fx:USD") return pick(u, d => u[d]);
    if (k === "fx:EUR") return pick(B.eur || {}, d => B.eur[d]);
    return [];
  };
  const closesOf = async ({ k, it }) => {
    if (!it) return benchSeries(k);
    if (it.kind === "fon" || it.kind === "ppf") {
      for (const periyod of [12, 6, 3]) {
        try {
          const d = await tefasPost("fonFiyatBilgiGetir", { fonKodu: it.symbol, dil: "TR", periyod });
          const rows = rowsOf(d).map(r => ({ p: num(field(r, /^fiyat$/i) ?? field(r, /fiyat|price/i)), d: parseDay(field(r, /tarih|date/i)) })).filter(r => r.p > 0 && r.d);
          if (rows.length >= 30) return rows.sort((a, b) => a.d - b.d).map(r => [r.d.toISOString().slice(0, 10), r.p]);
        } catch { /* daha kısa dönemi dene */ }
        await sleep(1100);
      }
      return [];
    }
    const sym = encodeURIComponent(yahooSymbol(it));
    for (const host of ["query1", "query2"]) {
      try {
        const d = (await (await get(`https://${host}.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1y`)).json())?.chart?.result?.[0];
        const ts = d?.timestamp || [], cl = d?.indicators?.quote?.[0]?.close || [], r = [];
        ts.forEach((t, i) => { const v = +cl[i]; if (v > 0) r.push([new Date((t + 3 * 3600) * 1000).toISOString().slice(0, 10), v]); });
        if (r.length >= 30) return r;
      } catch { /* diğer sunucu */ }
      await sleep(400);
    }
    return [];
  };
  const stats = (rows, kind) => {
    rows = rows.slice(-260).map(r => [r[0], r[1]]);
    // BIST'te günlük düşüş sınırı %10: bir günde %12'den fazla düşüş bedelsiz sermaye artırımı / bölünmedir; önceki fiyatlar aynı oranla düzeltilir
    if (kind === "hisse") for (let i = rows.length - 1; i > 0; i--) { const r = rows[i][1] / rows[i - 1][1]; if (r < 0.88) for (let j = 0; j < i; j++) rows[j][1] *= r; }
    const c = rows.map(r => r[1]), n = c.length, last = c[n - 1];
    const ma = w => n >= w ? c.slice(-w).reduce((a, b) => a + b, 0) / w : null;
    let g = 0, l = 0; for (let i = 1; i < Math.min(15, n); i++) { const d = c[i] - c[i - 1]; d > 0 ? g += d : l -= d; }
    g /= 14; l /= 14; for (let i = 15; i < n; i++) { const d = c[i] - c[i - 1]; g = (g * 13 + Math.max(d, 0)) / 14; l = (l * 13 + Math.max(-d, 0)) / 14; }
    const rsi = l === 0 ? 100 : 100 - 100 / (1 + g / l);
    const lr = []; for (let i = 1; i < n; i++) lr.push(Math.log(c[i] / c[i - 1]));
    const mean = lr.reduce((a, b) => a + b, 0) / lr.length, sd = Math.sqrt(lr.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, lr.length - 1));
    let peak = c[0], mdd = 0; for (const v of c) { peak = Math.max(peak, v); mdd = Math.min(mdd, v / peak - 1); }
    const back = k => n > k ? (last / c[n - 1 - k] - 1) * 100 : null, r4 = v => v == null ? null : +v.toPrecision(5);
    const step = Math.max(1, Math.ceil(n / 60)), sp = []; for (let i = 0; i < n; i += step) sp.push([rows[i][0], r4(c[i])]); if (sp[sp.length - 1][0] !== rows[n - 1][0]) sp.push([rows[n - 1][0], r4(last)]);
    return { v: 2, d: DAY, n, from: rows[0][0], last: r4(last), ma50: r4(ma(50)), ma200: r4(ma(200)), rsi: +rsi.toFixed(1), hi: r4(Math.max(...c)), lo: r4(Math.min(...c)),
      vol: +(sd * Math.sqrt(252) * 100).toFixed(1), mdd: +(mdd * 100).toFixed(1), r1m: r4(back(21)), r3m: r4(back(63)), r1y: r4((last / c[0] - 1) * 100), sp };
  };
  let done = 0, changed = false;
  for (const x of keys) {
    if (out.s[x.k]?.d === DAY && out.s[x.k]?.v === 2) continue;
    if (x.it && ++done > 20) break;                 // bir turda en fazla 20 uzak istek; kalanlar sonraki turda
    try { const rows = await closesOf(x); if (rows.length >= 30) { out.s[x.k] = stats(rows, x.it?.kind); changed = true; } else if (out.s[x.k]) out.s[x.k].d = DAY; }
    catch (e) { console.log(`karne ${x.k}: ${e.message}`); }
    await sleep(300);
  }
  if (changed || Object.keys(T.s || {}).length !== Object.keys(out.s).length) { out.updatedAt = new Date().toISOString(); await fs.writeFile(TF, JSON.stringify(out) + "\n"); console.log(`karne: ${Object.keys(out.s).length} varlık`); }
}

// ---------- gün içi değişim için: bugünün ve bir önceki günün fiyatları (data/close.json) ----------
// Büyük hareket uyarısı bu dosyadan hesaplanır. Gün (Türkiye saatiyle) değişince bugünün son fiyatları "önceki gün" olur.
try {
  const CF = "data/close.json", C = await readJSON(CF, {}), flat = {};
  for (const [k, v] of Object.entries(fx || {})) if (+v > 0) flat["fx:" + k] = +v;
  for (const [k, v] of Object.entries(gold || {})) if (typeof v === "number" && v > 0) flat["gold:" + k] = v;
  for (const [k, q] of Object.entries(quotes || {})) if (q && +q.p > 0) flat["q:" + k] = +q.p;
  const D = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
  const out = C.d === D ? { d: D, prev: C.prev || null, cur: flat } : { d: D, prev: C.cur ? { d: C.d, p: C.cur } : (C.prev || null), cur: flat };
  if (JSON.stringify(out) !== JSON.stringify(C)) await fs.writeFile(CF, JSON.stringify(out) + "\n");
} catch (e) { console.log("Gün içi kayıt yazılamadı: " + e.message); }
