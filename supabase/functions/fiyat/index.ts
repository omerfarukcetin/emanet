// Emanet · canlı fiyat (Supabase Edge Function, adı: fiyat)
// Uygulama açıkken 30 saniyede bir çağrılır; hisse, ABD hissesi ve kripto için Yahoo Finance'ten,
// altın ve döviz için finans.truncgil.com'dan son fiyatı alıp döndürür. Hiçbir şey saklamaz.
// BIST fiyatları kaynağın kendisinde yaklaşık 15 dakika gecikmelidir.
// Kurulum: Supabase → Edge Functions → Deploy a new function → Via Editor → adı "fiyat" → bu dosyayı yapıştır → Deploy.
// Sonra fonksiyonun Details/Settings bölümünde "Verify JWT with legacy secret" (Enforce JWT) seçeneğini KAPAT.

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, apikey, content-type, x-client-info", "access-control-allow-methods": "GET, OPTIONS" };
const UA = "Mozilla/5.0 (compatible; Emanet/1.0)";
const GOLD: Record<string, string[]> = { gram: ["GRA", "gram-altin", "Gram Altın"], ceyrek: ["CEYREKALTIN", "ceyrek-altin", "Çeyrek Altın"], yarim: ["YARIMALTIN", "yarim-altin", "Yarım Altın"], tam: ["TAMALTIN", "tam-altin", "Tam Altın"], cumhuriyet: ["CUMHURIYETALTINI", "cumhuriyet-altini", "Cumhuriyet Altını"], ata: ["ATAALTIN", "ata-altin", "Ata Altın"], hamit: ["HAMITALTIN", "hamit-altin", "Hamit Altın"], gumus: ["GUMUS", "gumus", "Gümüş"] };
const fold = (s: unknown) => String(s ?? "").toLocaleLowerCase("tr").replace(/[^a-z0-9çğıöşü]/g, "");
const num = (v: unknown) => { if (typeof v === "number") return v; let s = String(v ?? "").replace(/[^\d.,-]/g, ""); if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ""); return parseFloat(s); };
const cache = new Map<string, { t: number; v: unknown }>();
async function cached<T>(key: string, ms: number, f: () => Promise<T>): Promise<T> {
  const c = cache.get(key); if (c && Date.now() - c.t < ms) return c.v as T;
  const v = await f(); cache.set(key, { t: Date.now(), v }); return v;
}
async function get(url: string) { const r = await fetch(url, { headers: { "user-agent": UA, accept: "application/json,*/*" }, signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error(String(r.status)); return r; }

async function goldFx() {
  for (const u of ["https://finans.truncgil.com/v4/today.json", "https://finans.truncgil.com/today.json"]) {
    try {
      const d = await (await get(u)).json() as Record<string, any>;
      const ent = Object.entries(d).filter(([, v]) => v && typeof v === "object");
      const find = (...n: string[]) => { for (const x of n) { const h = ent.find(([k, v]) => fold(k) === fold(x) || fold(v.Name) === fold(x)); if (h) return h[1]; } return null; };
      const sell = (o: any) => o ? num(o.Selling ?? o["Satış"] ?? o.selling) : NaN;
      const fx: Record<string, number> = {}, gold: Record<string, number> = {};
      const u$ = sell(find("USD", "Amerikan Doları")), e$ = sell(find("EUR", "Euro"));
      if (u$ > 0) fx.USD = +u$.toFixed(4); if (e$ > 0) fx.EUR = +e$.toFixed(4);
      for (const [k, names] of Object.entries(GOLD)) { const v = sell(find(...names)); if (v > 0) gold[k] = +v.toFixed(2); }
      if (Object.keys(gold).length >= 3) return { fx, gold };
    } catch { /* sonraki kaynak */ }
  }
  return { fx: {}, gold: {} };
}
function ySym(kind: string, s: string) { return kind === "hisse" ? s + ".IS" : kind === "kripto" ? s + "-USD" : s.replace(/\./g, "-"); }
async function quote(kind: string, s: string) {
  for (const h of ["query1", "query2"]) {
    try {
      const d = await (await get(`https://${h}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym(kind, s))}?interval=1d&range=1d`)).json();
      const m = d?.chart?.result?.[0]?.meta;
      if (m && m.regularMarketPrice > 0) return { p: +m.regularMarketPrice, pc: +(m.chartPreviousClose || m.previousClose) || 0, cur: m.currency || (kind === "hisse" ? "TRY" : "USD"), t: new Date((m.regularMarketTime || Date.now() / 1000) * 1000).toISOString() };
    } catch { /* diğer sunucu */ }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const url = new URL(req.url);
  const keys = [...new Set((url.searchParams.get("k") || "").split(",").map(x => x.trim()).filter(x => /^(hisse|abd|kripto):[A-Z0-9.\-]{1,12}$/.test(x)))].slice(0, 60);
  const [gf, qs] = await Promise.all([
    cached("gf", 20000, goldFx),
    Promise.all(keys.map(k => cached("q:" + k, 20000, () => { const i = k.indexOf(":"); return quote(k.slice(0, i), k.slice(i + 1)); }).then(v => [k, v] as const))),
  ]);
  const quotes: Record<string, unknown> = {};
  for (const [k, v] of qs) if (v) quotes[k] = v;
  return new Response(JSON.stringify({ t: new Date().toISOString(), ...gf, quotes }), { headers: { ...CORS, "content-type": "application/json", "cache-control": "no-store" } });
});
