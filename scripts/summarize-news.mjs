// Emanet — piyasa gündemi özeti (data/news.json içindeki "sum" alanı).
// Nitelikli kaynakların başlıklarından yapay zekâ ile kısa bir Türkçe özet yazdırır. Anahtar depo sırlarından gelir:
//   GEMINI_API_KEY (Google AI Studio, ücretsiz kota) ya da ANTHROPIC_API_KEY (Claude). İkisi de yoksa adım sessizce atlanır.
// Model yalnızca verilen başlıkları kullanır: haber metni çekilmez, tahmin ve tavsiye istenmez. Her madde hangi başlıklara dayandığını söyler.
// En fazla saatte bir çalışır; başlıklar değişmediyse yeniden yazmaz. Herhangi bir hata olursa eski özet kalır, fiyat güncellemesi etkilenmez.
import fs from "node:fs/promises";
import crypto from "node:crypto";

const FILE = "data/news.json";
const GEM = (process.env.GEMINI_API_KEY || "").trim(), ANT = (process.env.ANTHROPIC_API_KEY || "").trim();
if (!GEM && !ANT) { console.log("GEMINI_API_KEY / ANTHROPIC_API_KEY sırrı yok; özet atlandı."); process.exit(0); }
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

const parse = txt => { const m = String(txt || "").match(/\{[\s\S]*\}/); if (!m) throw new Error("JSON yok: " + String(txt).slice(0, 120)); return JSON.parse(m[0]); };
async function post(url, headers, body) {
  const r = await fetch(url, { method: "POST", signal: AbortSignal.timeout(90000), headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  const raw = await r.text(); if (!r.ok) throw new Error("HTTP " + r.status + " " + raw.slice(0, 200));
  return JSON.parse(raw);
}
const ask = {
  gemini: async model => { const d = await post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { "x-goog-api-key": GEM },
    { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 2000, responseMimeType: "application/json" } });
    return parse((d.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("")); },
  claude: async model => { const d = await post("https://api.anthropic.com/v1/messages", { "x-api-key": ANT, "anthropic-version": "2023-06-01" },
    { model, max_tokens: 1500, temperature: 0.2, system, messages: [{ role: "user", content: user }] });
    return parse((d.content || []).filter(c => c.type === "text").map(c => c.text).join("")); }
};
const tries = [...(GEM ? [["gemini", "gemini-3.8-flash"], ["gemini", "gemini-flash-latest"], ["gemini", "gemini-3.8-flash"], ["gemini", "gemini-flash-lite-latest"]] : []), ...(ANT ? [["claude", "claude-haiku-5-5"], ["claude", "claude-haiku-4-5"]] : [])];
let res = null;
for (const [p, m] of tries) { try { res = await ask[p](m); res._m = m; break; } catch (e) { console.log("Özet (" + m + "):", e.message.slice(0, 160)); if (/\b(429|503)\b/.test(e.message)) await new Promise(r => setTimeout(r, 8000)); } }
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
