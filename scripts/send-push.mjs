// Emanet · bildirim gönderici
// Her fiyat güncellemesinden sonra çalışır ve kayıtlı cihazlardan sırası gelenlere içi boş bir "uyandırma" yollar.
// Kimin ne zaman uyandırılacağına cihazın kendi ayarları karar verir (saat, hafta sonu, haftalık/aylık özet, büyük hareket eşiği).
// Tutarlar sunucuya hiç gelmez: bildirimin metnini telefondaki uygulama kendi verisiyle yazar.
// Büyük hareket uyarısı için cihaz yalnızca portföyün yüzde dağılımını (tutar değil) bildirir.
// Gereken: js/config.js içinde vapidPublicKey, depo sırlarında VAPID_PRIVATE_KEY, Supabase'de emanet_push_list/emanet_push_mark işlevleri.
import fs from "node:fs/promises";
import crypto from "node:crypto";

const cfg = await fs.readFile("js/config.js", "utf8").catch(() => "");
const pick = k => (cfg.match(new RegExp(k + ':\\s*"([^"]+)"')) || [])[1];
const url = (pick("supabaseUrl") || "").replace(/\/$/, ""), key = pick("supabaseKey"), pub = pick("vapidPublicKey");
const priv = (process.env.VAPID_PRIVATE_KEY || "").trim();
const FORCE = process.env.PUSH_FORCE === "1";          // elle deneme: ayarlara bakmadan herkese gönder
if (!url || !key || !pub) { console.log("Bildirim kurulmamış (config.js eksik); atlandı."); process.exit(0); }
if (!priv) { console.log("VAPID_PRIVATE_KEY sırrı tanımlı değil; bildirim gönderilmedi."); process.exit(0); }

const b64u = b => Buffer.from(b).toString("base64url");
const raw = Buffer.from(pub, "base64url");
if (raw.length !== 65 || raw[0] !== 4) { console.error("vapidPublicKey biçimi hatalı."); process.exit(1); }
const signKey = crypto.createPrivateKey({ format: "jwk", key: { kty: "EC", crv: "P-256", d: priv, x: b64u(raw.subarray(1, 33)), y: b64u(raw.subarray(33)) } });
function vapidToken(aud) {
  const head = b64u(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const body = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "https://github.com/omerfarukcetin/emanet" }));
  return head + "." + body + "." + b64u(crypto.sign("sha256", Buffer.from(head + "." + body), { key: signKey, dsaEncoding: "ieee-p1363" }));
}
const rpc = async (fn, args) => {
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: key, authorization: "Bearer " + key, "content-type": "application/json" }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 200));
  const t = await r.text(); return t ? JSON.parse(t) : null;
};

let rows;
try { rows = await rpc("emanet_push_list", { secret: priv }) || []; }
catch (e) { console.error("Cihaz listesi okunamadı. Supabase'de bildirim kurulum SQL'inin son hâli çalıştırıldı mı? " + e.message); process.exit(FORCE ? 1 : 0); }

// Bugünkü ve bir önceki günün fiyatları: büyük hareket hesabı için (fetch-prices.mjs tutar)
const close = JSON.parse(await fs.readFile("data/close.json", "utf8").catch(() => "{}"));
function dayMove(weights) {
  const cur = close.cur, prev = close.prev && close.prev.p; if (!cur || !prev || !weights) return null;
  let s = 0, n = 0;
  for (const [k, w] of Object.entries(weights)) { const a = +prev[k], b = +cur[k]; if (a > 0 && b > 0 && +w) { s += +w * (b / a - 1); n++; } }
  return n ? s * 100 : null;
}
const pad = n => String(n).padStart(2, "0");
export function decide(row, nowMs) {
  const p = row.prefs || {}, off = Number.isFinite(+p.off) ? +p.off : 180;
  const L = new Date(nowMs + off * 6e4), D = L.toISOString().slice(0, 10), hm = pad(L.getUTCHours()) + ":" + pad(L.getUTCMinutes()), dow = L.getUTCDay();
  const lastDay = new Date(L.getTime() + 864e5).getUTCMonth() !== L.getUTCMonth();
  const t = /^\d\d:\d\d$/.test(p.t) ? p.t : "18:30", daily = p.d !== false;
  const zkGap = p.zk !== false && /^\d{4}-\d\d-\d\d$/.test(p.zd || "") ? Math.round((Date.parse(p.zd + "T00:00:00Z") - Date.parse(D + "T00:00:00Z")) / 864e5) : null;
  const sched = hm >= t && row.last_poke !== D && ((daily && (p.we || (dow >= 1 && dow <= 5))) || (p.w && dow === 5) || (p.m && lastDay) || [7, 1, 0].includes(zkGap));
  // gün içi özet saatleri: saati gelmiş, en fazla 2 saat geçmiş ve bugün gönderilmemiş olanlar (kayıt "fired" alanında ts:SS:DD olarak tutulur)
  const mins = x => +x.slice(0, 2) * 60 + +x.slice(3);
  const ts = Array.isArray(p.ts) && row.fired && (p.we || (dow >= 1 && dow <= 5)) ? p.ts.filter(x => /^\d\d:\d\d$/.test(x) && hm >= x && mins(hm) - mins(x) <= 120 && row.fired["ts:" + x] !== D) : [];
  let big = false, mv = null;
  if (+p.bm > 0 && row.last_big !== D && hm >= "08:00" && hm <= "23:00" && !(daily && row.last_poke === D)) { mv = dayMove(row.weights); big = mv != null && Math.abs(mv) >= +p.bm; }
  // fiyat alarmları: yalnızca veritabanı işlevi "fired" alanını döndürüyorsa (yeni kurulum) değerlendirilir
  const fire = [], rearm = [];
  if (Array.isArray(p.al) && row.fired && close.cur) for (const a of p.al) {
    const c = +close.cur[a.k]; if (!(c > 0) || !(+a.v > 0)) continue;
    const on = a.op === "gte" ? c >= +a.v : c <= +a.v, was = a.id in row.fired;
    if (on && !was && hm >= "08:00" && hm <= "23:00") fire.push(a.id); else if (!on && was) rearm.push(a.id);
  }
  return { D, sched: !!sched, big, mv, fire, rearm, ts };
}

let ok = 0, gone = 0, fail = 0, skip = 0;
for (const row of rows) {
  const d = FORCE ? { D: "", sched: true, big: false, fire: [], rearm: [], ts: [] } : decide(row, Date.now());
  for (const id of d.rearm) await rpc("emanet_push_mark", { secret: priv, ep: row.endpoint, kind: "rearm:" + id, d: d.D }).catch(() => {});
  if (!d.sched && !d.big && !d.fire.length && !d.ts.length) { skip++; continue; }
  let host = "?";
  try {
    const u = new URL(row.endpoint); host = u.host;
    if (u.protocol !== "https:") throw new Error("https değil");
    const r = await fetch(row.endpoint, { method: "POST", headers: { authorization: `vapid t=${vapidToken(u.origin)}, k=${pub}`, ttl: "10800", urgency: (d.big || d.fire.length) && !d.sched ? "high" : "normal", "content-length": "0" } });
    if (r.status >= 200 && r.status < 300) {
      ok++;
      if (!FORCE) { if (d.sched) await rpc("emanet_push_mark", { secret: priv, ep: row.endpoint, kind: "poke", d: d.D }); if (d.big) await rpc("emanet_push_mark", { secret: priv, ep: row.endpoint, kind: "big", d: d.D }); for (const id of d.fire) await rpc("emanet_push_mark", { secret: priv, ep: row.endpoint, kind: "alert:" + id, d: d.D }); for (const x of d.ts) await rpc("emanet_push_mark", { secret: priv, ep: row.endpoint, kind: "alert:ts:" + x, d: d.D }); }
    } else if (r.status === 404 || r.status === 410) { gone++; await rpc("emanet_push_mark", { secret: priv, ep: row.endpoint, kind: "gone", d: d.D || "2000-01-01" }).catch(() => {}); }
    else { fail++; console.log(`- ${host}: HTTP ${r.status} ${(await r.text()).slice(0, 160)}`); }
  } catch (e) { fail++; console.log(`- ${host}: ${e.message}`); }
}
console.log(`Bildirim: ${ok} gönderildi, ${skip} sırası değil, ${gone} geçersiz (silindi), ${fail} hata · toplam ${rows.length} cihaz${FORCE ? " · elle deneme" : ""}.`);
if (FORCE && rows.length && !ok) process.exit(1);
