// Emanet — piyasa gündemi özeti (data/news.json içindeki "sum" alanı).
// Nitelikli kaynakların başlıklarından, GitHub Models (Actions'ın kendi GITHUB_TOKEN'ı, ücretsiz kota) ile kısa bir Türkçe özet yazdırır.
// Model yalnızca verilen başlıkları kullanır: haber metni çekilmez, tahmin ve tavsiye istenmez. Her madde hangi başlıklara dayandığını söyler.
// En fazla saatte bir çalışır; başlıklar değişmediyse yeniden yazmaz. Herhangi bir hata olursa eski özet kalır, fiyat güncellemesi etkilenmez.
import fs from "node:fs/promises";
import crypto from "node:crypto";

const FILE = "data/news.json";
const token = process.env.GITHUB_TOKEN;
if (!token) { console.log("GITHUB_TOKEN yok; özet atlandı."); process.exit(0); }
const news = await fs.readFile(FILE, "utf8").then(JSON.parse).catch(() => null);
if (!news || !news.t) { console.log("news.json yok; özet atlandı."); process.exit(0); }
const bench = await fs.readFile("data/bench.json", "utf8").then(JSON.parse).catch(() => ({}));

const T = [["altin", "Altın (ons)", "xau"], ["gumus", "Gümüş (ons)", "xag"], ["btc", "Bitcoin", "btc"], ["bist", "BIST 100", "xu100"], ["dolar", "Dolar/TL", "usd"], ["petrol", "Brent petrol", "brent"]];
const WHY = /neden|nedeni|etkisi|etkiled|beklenti|\bfed\b|faiz|enflasyon|tutanak|savaş|gerilim|ateşkes|tarife|gümrük|opec|\barz\b|stok|kâr satış|kar satış|tasfiye|yasa[ğk]|düzenleme|rezerv|\betf\b|bilanço|tcmb|merkez bankası|veri|tahmin/i;
const dayChg = id => { const s = bench[id]; if (!s) return null; const k = Object.keys(s).sort(); if (k.length < 2) return null; const a = s[k[k.length - 2]], b = s[k[k.length - 1]]; return a > 0 ? (b / a - 1) * 100 : null; };

// modele gidecek başlıklar: her konudan en fazla 8 nitelikli, tık tuzağı olmayan, son 30 saatin başlığı
const src = [];
const blocks = T.map(([k, name, id]) => {
  const c = dayChg(id);
  const l = (news.t[k] || []).filter(x => x.q && !x.cb && !x.r && (!x.d || Date.now() - Date.parse(x.d) < 30 * 3600e3))
    .sort((a, b) => (WHY.test(b.t) - WHY.test(a.t)) || ((b.n || 0) - (a.n || 0))).slice(0, 8);
  const lines = l.map(x => { let i = src.findIndex(y => y.u === x.u); if (i < 0) { src.push({ t: x.t, s: x.s, u: x.u }); i = src.length - 1; } return `[${i}] ${x.t} (${x.s})`; });
  return `## ${name} · bugünkü değişim: ${c == null ? "bilinmiyor" : (c >= 0 ? "+" : "") + c.toFixed(2) + "%"}\n${lines.join("\n") || "(nitelikli başlık yok)"}`;
});
if (src.length < 3) { console.log("Özet için yeterli nitelikli başlık yok."); process.exit(0); }

const hash = crypto.createHash("sha1").update(src.map(x => x.t).sort().join("\n")).digest("hex").slice(0, 12);
const old = news.sum;
if (!process.argv.includes("--force") && process.env.GITHUB_EVENT_NAME !== "workflow_dispatch" && old && (old.h === hash || Date.now() - Date.parse(old.at) < 55 * 6e4)) {
  console.log("Özet güncel, atlandı."); process.exit(0);
}

const system = `Sen bir Türk finans uygulamasında piyasa gündemini özetleyen tarafsız bir editörsün.
Kurallar:
- YALNIZCA verilen haber başlıklarındaki bilgileri kullan. Başlıkta olmayan sebep, rakam, isim ya da olay ekleme.
- Tahmin yapma, yön söyleme, al/sat/tut tavsiyesi verme, "fırsat", "kaçırma" gibi ifadeler kullanma.
- Sebebi başlıklar açıkça söylüyorsa "başlıklara göre ... etkili oldu" diye aktar; söylemiyorsa sebep uydurma.
- Kurumların tahminlerini (ör. bir bankanın hedef fiyatı) "X'e göre" diye, kime ait olduğunu belirterek aktar.
- Sade, kısa, düz Türkçe yaz. Ünlem, abartı ve "son dakika" dili kullanma.
- Yanıtın SADECE şu JSON olsun:
{"genel":"Günün tablosunu anlatan en fazla 2 cümle","maddeler":[{"konu":["altin"],"baslik":"En fazla 8 kelimelik başlık","ozet":"2-3 cümle","kaynak":[0,3]}]}
- "konu" değerleri yalnızca: altin, gumus, btc, bist, dolar, petrol. Bir gelişme birden fazla piyasayı ilgilendiriyorsa hepsini yaz.
- En önemli 3-5 gelişmeyi seç; aynı gelişmeyi tekrar etme. "kaynak", dayandığın başlıkların köşeli parantez içindeki numaralarıdır (en az 1).`;
const user = `Bugün: ${new Date().toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", year: "numeric" })}\n\n${blocks.join("\n\n")}`;

async function ask(model) {
  const r = await fetch("https://models.github.ai/inference/chat/completions", {
    method: "POST", signal: AbortSignal.timeout(60000),
    headers: { authorization: "Bearer " + token, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "content-type": "application/json" },
    body: JSON.stringify({ model, temperature: 0.2, max_tokens: 1200, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: user }] })
  });
  if (!r.ok) throw new Error(model + " HTTP " + r.status + " " + (await r.text()).slice(0, 200));
  const d = await r.json(), txt = d.choices?.[0]?.message?.content || "";
  return JSON.parse(txt.replace(/^```(json)?|```$/g, "").trim());
}
let res = null;
for (const m of ["openai/gpt-4.1-mini", "openai/gpt-4o-mini"]) { try { res = await ask(m); res._m = m; break; } catch (e) { console.log("Özet:", e.message); } }
if (!res) process.exit(0);

const KEYS = new Set(T.map(x => x[0]));
const items = (Array.isArray(res.maddeler) ? res.maddeler : []).map(x => ({
  k: (Array.isArray(x.konu) ? x.konu : [x.konu]).filter(k => KEYS.has(k)),
  b: String(x.baslik || "").trim().slice(0, 90),
  o: String(x.ozet || "").trim().slice(0, 600),
  src: [...new Set((Array.isArray(x.kaynak) ? x.kaynak : []).map(Number).filter(i => src[i]))].slice(0, 4).map(i => src[i])
})).filter(x => x.o && x.src.length).slice(0, 5);
if (!items.length) { console.log("Özet boş döndü; eski özet korundu."); process.exit(0); }
news.sum = { at: new Date().toISOString(), h: hash, m: res._m, g: String(res.genel || "").trim().slice(0, 400), i: items };
await fs.writeFile(FILE, JSON.stringify(news) + "\n");
console.log(`Özet yazıldı (${res._m}): ${news.sum.g}\n` + items.map(x => `- [${x.k.join(",")}] ${x.b}: ${x.o}`).join("\n"));
