// Emanet · gün sonu bildirimi
// Kayıtlı cihazlara içi boş bir "uyandırma" bildirimi yollar. Tutarlar sunucuya hiç gelmez:
// günlük kâr/zararı telefondaki uygulama, kendi kayıtlı verisi ve güncel fiyat dosyasıyla hesaplar.
// Gereken: js/config.js içinde vapidPublicKey ve depo sırlarında VAPID_PRIVATE_KEY.
import fs from "node:fs/promises";
import crypto from "node:crypto";

const cfg = await fs.readFile("js/config.js", "utf8").catch(() => "");
const pick = k => (cfg.match(new RegExp(k + ':\\s*"([^"]+)"')) || [])[1];
const url = pick("supabaseUrl"), key = pick("supabaseKey"), pub = pick("vapidPublicKey");
const priv = (process.env.VAPID_PRIVATE_KEY || "").trim();
if (!url || !key || !pub) { console.log("Bildirim kurulmamış (config.js eksik); atlandı."); process.exit(0); }
if (!priv) { console.log("VAPID_PRIVATE_KEY sırrı tanımlı değil; bildirim gönderilmedi."); process.exit(0); }

const b64u = b => Buffer.from(b).toString("base64url");
const raw = Buffer.from(pub, "base64url");
if (raw.length !== 65 || raw[0] !== 4) { console.error("vapidPublicKey biçimi hatalı."); process.exit(1); }
const signKey = crypto.createPrivateKey({ format: "jwk", key: { kty: "EC", crv: "P-256", d: priv, x: b64u(raw.subarray(1, 33)), y: b64u(raw.subarray(33)) } });
export function vapidToken(aud, now = Date.now()) {
  const head = b64u(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const body = b64u(JSON.stringify({ aud, exp: Math.floor(now / 1000) + 12 * 3600, sub: "https://github.com/omerfarukcetin/emanet" }));
  const sig = crypto.sign("sha256", Buffer.from(head + "." + body), { key: signKey, dsaEncoding: "ieee-p1363" });
  return head + "." + body + "." + b64u(sig);
}

let rows;
try {
  const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/emanet_push?select=endpoint&limit=1000`, { headers: { apikey: key, authorization: "Bearer " + key } });
  if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 200));
  rows = await r.json();
} catch (e) { console.error("Cihaz listesi okunamadı (emanet_push tablosu kurulu mu?): " + e.message); process.exit(1); }

let ok = 0, gone = 0, fail = 0;
for (const { endpoint } of rows) {
  let host = "?";
  try {
    const u = new URL(endpoint); host = u.host;
    if (u.protocol !== "https:") throw new Error("https değil");
    const r = await fetch(endpoint, { method: "POST", headers: { authorization: `vapid t=${vapidToken(u.origin)}, k=${pub}`, ttl: "21600", urgency: "normal", "content-length": "0" } });
    if (r.status >= 200 && r.status < 300) ok++;
    else if (r.status === 404 || r.status === 410) gone++;           // cihaz bildirimi kapatmış ya da uygulamayı kaldırmış
    else { fail++; console.log(`- ${host}: HTTP ${r.status} ${(await r.text()).slice(0, 160)}`); }
  } catch (e) { fail++; console.log(`- ${host}: ${e.message}`); }
}
console.log(`Bildirim: ${ok} gönderildi, ${gone} geçersiz, ${fail} hata (toplam ${rows.length} cihaz).`);
if (rows.length && !ok && fail) process.exit(1);
