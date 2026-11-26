// Emanet — Diyanet hicri takvimi (data/hicri.json): her hicri ayın miladi başlangıç günü.
// Türkiye'de kullanılan hicri tarih Diyanet'in takvimidir; tarayıcıların hazır takvimleri (Ümmü'l-Kura vb.) bazı aylarda bir gün kayar.
// Diyanet'in namaz vakti tablosundaki (yaklaşık bir aylık) hicri tarihlerden ay başları çıkarılır ve önceki kayıtlarla birleştirilir.
// Günde bir kez çalışır (dosya 20 saatten yeniyse atlar). Kaynak alınamazsa dosyaya dokunmaz.
import fs from "node:fs/promises";

const OUT = "data/hicri.json";
const prev = await fs.readFile(OUT, "utf8").then(JSON.parse).catch(() => ({ starts: {} }));
if (!process.argv.includes("--force") && process.env.GITHUB_EVENT_NAME !== "workflow_dispatch" && prev.updatedAt && Date.now() - Date.parse(prev.updatedAt) < 20 * 3600e3) { console.log("Hicri takvim güncel, atlandı."); process.exit(0); }

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const AY = ["ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"];
const HM = ["muharrem", "safer", "rebiülevvel", "rebiülahir", "cemaziyelevvel", "cemaziyelahir", "recep", "şaban", "ramazan", "şevval", "zilkade", "zilhicce"];
const fold = s => s.toLocaleLowerCase("tr").replace(/\s+/g, "").replace(/î/g, "i").replace(/â/g, "a").replace(/û/g, "u").replace(/'/g, "");
const iso = (d, m, y) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const rows = [];   // [miladi ISO, hicri yıl, ay, gün]

// 1) ezanvakti (Diyanet verisini JSON olarak verir) · İstanbul
async function ezan() {
  const r = await fetch("https://ezanvakti.emushaf.net/vakitler/9541", { headers: { "user-agent": UA, accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error("ezanvakti " + r.status);
  for (const x of await r.json()) {
    const g = String(x.MiladiTarihKisa || "").match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/), h = String(x.HicriTarihKisa || "").match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (g && h) rows.push([iso(+g[1], +g[2], +g[3]), +h[3], +h[2], +h[1]]);
  }
}
// 2) Diyanet'in kendi sayfası (tablodaki "26.11.2026 … 17 Cemaziyelahir 1448")
async function diyanet() {
  const r = await fetch("https://namazvakitleri.diyanet.gov.tr/tr-TR/9541", { headers: { "user-agent": UA, accept: "text/html" }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error("diyanet " + r.status);
  const t = (await r.text()).replace(/<[^>]+>/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  // haftalık / aylık / yıllık tablolar: "26 Kasım 2026 Perşembe 17 Cemaziyelahir 1448"
  for (const m of t.matchAll(/(\d{1,2}) ([A-Za-zÇĞİÖŞÜçğıöşü]+) (\d{4}) [A-Za-zÇĞİÖŞÜçğıöşü]+ (\d{1,2}) ([A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû']+) (\d{4})/g)) {
    const gm = AY.indexOf(fold(m[2])), hm = HM.indexOf(fold(m[5])); if (gm >= 0 && hm >= 0) rows.push([iso(+m[1], gm + 1, +m[3]), +m[6], hm + 1, +m[4]]);
  }
}
for (const f of [diyanet, ezan]) { try { await f(); if (rows.length >= 7) break; } catch (e) { console.log("Hicri:", e.message); } }
if (rows.length < 7) { console.log("Hicri takvim alınamadı; önceki dosya korunur."); process.exit(0); }

// ay başları: miladi gün − (hicri gün − 1). Aynı ay için farklı sonuç çıkarsa en sık görüleni alınır.
const cnt = {};
for (const [g, y, m, d] of rows) {
  const s = new Date(Date.parse(g + "T00:00:00Z") - (d - 1) * 864e5).toISOString().slice(0, 10), k = `${y}-${m}`;
  (cnt[k] = cnt[k] || {})[s] = (cnt[k][s] || 0) + 1;
}
const starts = { ...(prev.starts || {}) };
for (const [k, o] of Object.entries(cnt)) starts[k] = Object.entries(o).sort((a, b) => b[1] - a[1])[0][0];
const out = { updatedAt: new Date().toISOString(), source: "Diyanet İşleri Başkanlığı", starts: Object.fromEntries(Object.entries(starts).sort((a, b) => a[1].localeCompare(b[1]))) };
await fs.writeFile(OUT, JSON.stringify(out) + "\n");
console.log(`Hicri takvim: ${rows.length} gün okundu · ay başları: ${Object.entries(cnt).map(([k]) => k + " → " + starts[k]).join(", ")}`);
