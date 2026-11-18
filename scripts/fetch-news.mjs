// Emanet — piyasa haberleri (data/news.json): altın, gümüş, bitcoin, BIST, dolar, petrol için son haber başlıkları.
// Yalnızca başlık, kaynak adı, bağlantı ve saat tutulur; haberin metni kopyalanmaz. Başlıklarda en sık geçen konular ("temalar")
// basit bir kelime sayımıyla çıkarılır: bu bir yorum ya da tahmin değildir, "haberlerde bugün en çok ne konuşuluyor" özetidir.
// 25 dakikadan yeni dosya varsa hiçbir şey yapmaz. Bir konu alınamazsa o konunun önceki listesi korunur.
import fs from "node:fs/promises";

const OUT = "data/news.json";
const prev = await fs.readFile(OUT, "utf8").then(JSON.parse).catch(() => ({}));
if (!process.argv.includes("--force") && process.env.GITHUB_EVENT_NAME !== "workflow_dispatch" && prev.updatedAt && Date.now() - Date.parse(prev.updatedAt) < 25 * 6e4) { console.log("Haberler güncel, atlandı."); process.exit(0); }

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
// konu: [arama, başlıkta mutlaka geçmesi gereken kelime]
const TOPICS = {
  altin: ["altın fiyatları OR ons altın OR gram altın", /altın|\bons\b/i],
  gumus: ["gümüş fiyatları OR ons gümüş", /gümüş/i],
  btc: ["bitcoin OR kripto para piyasası", /bitcoin|\bbtc\b|kripto/i],
  bist: ["borsa istanbul OR bist 100", /borsa|\bbist\b|hisse/i],
  dolar: ["\"dolar\" kur OR \"dolar/tl\" OR \"dolar endeksi\"", /dolar|\bkur\b|kuru|döviz|\busd\b/i],
  petrol: ["brent petrol fiyatları OR ham petrol", /petrol|brent|opec|akaryakıt|benzin|motorin/i]
};
// tema: [etiket, başlıkta aranan kalıp]. Yalnızca "neden" anlatan konular; "düştü / yükseldi" gibi yön bildirenler sayılmaz.
const THEMES = [
  ["Fed ve faiz", /\bfed\b|faiz ind|faiz art|faiz karar|faiz beklenti|powell|fomc|tutanak/i],
  ["TCMB ve faiz", /tcmb|merkez bankası|politika faizi|karahan/i],
  ["Enflasyon verisi", /enflasyon|tüfe|\bcpi\b|\bpce\b/i],
  ["ABD verileri", /istihdam|tarım dışı|işsizlik|büyüme verisi|gsyh|\bpmi\b/i],
  ["Jeopolitik gerilim", /savaş|saldırı|ateşkes|israil|iran|rusya|ukrayna|gerilim|çatışma|füze/i],
  ["Gümrük ve ticaret", /gümrük|tarife|ticaret savaş/i],
  ["Kâr satışı", /kâr satış|kar satış|kâr realiz|kar realiz/i],
  ["Güçlü dolar", /dolar endeksi|\bdxy\b|doların güç|dolar güçlen/i],
  ["ETF akışları", /\betf\b/i],
  ["Merkez bankası alımları", /merkez bankalar.*alım|rezerv/i],
  ["Düzenleme ve yasak", /\bsec\b|düzenleme|regülasyon|yasağı|yasak getir|vergi düzen/i],
  ["Kurum tahminleri", /tahmin|hedef fiyat|beklenti/i],
  ["Satış baskısı", /satış dalga|satış baskı|para çıkış|panik satış/i],
  ["Şirket bilançoları", /bilanço/i],
  ["Tasfiye ve kaldıraç", /tasfiye|likidasyon|kaldıraç/i],
  ["Seçim ve siyaset", /seçim|trump|siyasi/i],
  ["OPEC ve arz", /opec|\barz\b|üretim kes|stok/i],
  ["Hack ve güvenlik", /saldırı.*(borsa|kripto|milyon)|hack|çalındı/i],
  ["Akaryakıt indirimi / zammı", /akaryakıt|motorin|benzin/i]
];
const dec = s => String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const tag = (x, t) => { const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? dec(m[1]) : ""; };

async function rss(url) {
  const r = await fetch(url, { headers: { "user-agent": UA, accept: "application/rss+xml,application/xml,text/xml,*/*" }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(new URL(url).hostname + " " + r.status);
  const x = await r.text();
  return [...x.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const it = m[1]; let t = tag(it, "title"), s = tag(it, "source");
    // Google News başlığın sonuna " - Kaynak" ekler
    if (s && t.endsWith(" - " + s)) t = t.slice(0, -(s.length + 3));
    else if (!s) { const i = t.lastIndexOf(" - "); if (i > 20) { s = t.slice(i + 3); t = t.slice(0, i); } }
    const d = Date.parse(tag(it, "pubDate"));
    return { t, s, u: tag(it, "link"), d: isFinite(d) ? new Date(d).toISOString() : null };
  }).filter(x => x.t && x.u && /^https?:\/\//.test(x.u));
}
const sources = q => [
  `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:2d")}&hl=tr&gl=TR&ceid=TR:tr`,
  `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&setlang=tr-TR&cc=TR`
];
const key = t => t.toLocaleLowerCase("tr").replace(/[^a-zçğıöşü0-9]+/g, " ").trim().slice(0, 60);
const out = { updatedAt: new Date().toISOString(), t: {}, th: {} };
for (const [k, [q, must]] of Object.entries(TOPICS)) {
  let items = null, err = "";
  for (const u of sources(q)) { try { const l = await rss(u); if (l.filter(x => must.test(x.t)).length >= 3) { items = l; break; } } catch (e) { err = e.message; } }
  if (!items) { out.t[k] = prev.t?.[k] || []; out.th[k] = prev.th?.[k] || []; console.log(`${k}: alınamadı (${err}); önceki liste korundu`); continue; }
  const lim = Date.now() - 48 * 3600e3, seen = new Set();
  const rel = items.filter(x => must.test(x.t) && !/\bKAP\b|\*\*\*/.test(x.t)).filter(x => !x.d || Date.parse(x.d) >= lim).filter(x => { const kk = key(x.t); if (seen.has(kk)) return false; seen.add(kk); return true; })
    .sort((a, b) => (b.d || "").localeCompare(a.d || ""));
  const list = rel.slice(0, 10);
  // tema sayımı: son 24 saatin başlıkları (yoksa hepsi)
  const recent = rel.slice(0, 40).filter(x => x.d && Date.parse(x.d) >= Date.now() - 24 * 3600e3), pool = recent.length >= 3 ? recent : rel.slice(0, 40);
  const th = THEMES.map(([l, re]) => [l, pool.filter(x => re.test(x.t)).length]).filter(x => x[1] >= 2 && x[1] >= pool.length * 0.08).sort((a, b) => b[1] - a[1]).slice(0, 4);
  out.t[k] = list; out.th[k] = th;
  console.log(`${k}: ${list.length} başlık · ${th.map(x => x[0] + " " + x[1]).join(", ") || "tema yok"}`);
  await new Promise(r => setTimeout(r, 700));
}
await fs.writeFile(OUT, JSON.stringify(out) + "\n");
