# Emanet

Aile portföyü, gelir-gider, borç ve zekât defteri. Telefona uygulama gibi kurulabilen (PWA), sunucusuz bir web uygulaması.

- **Portföy:** birden fazla portföy; altın, hisse (BIST ve ABD), fon, döviz, kripto, BES; alım-satım, komisyon, stopaj; TL ve dolar bazında kâr/zarar, Yİ-ÜFE'ye göre reel getiri.
- **Gelir-gider:** sabit ödemeler, kredi kartları ve taksitler, kategori bütçeleri, birikim hedefleri.
- **Borç:** verilen ve alınan borçlar, parça parça ödeme, vade uyarıları.
- **Değer geçmişi:** her portföy için günlük kayıt; TL, dolar ve gram altın cinsinden grafik.
- **Zekât:** portföy bazında nisap (altın gramı), hicri zekât günü (havl), ödeme kayıtları.

## Nasıl çalışır

| Parça | Nerede |
| --- | --- |
| Uygulama | GitHub Pages (bu deponun kökü) |
| Giriş ve veriler | Supabase (ücretsiz plan): e-posta + şifre, kullanıcı başına tek satır, satır güvenliği (RLS) |
| Fiyatlar | `.github/workflows/prices.yml` yarım saatte bir `scripts/fetch-prices.mjs` betiğini çalıştırır, sonucu `data/market.json` dosyasına yazar |
| Geçmiş kurlar | Alış tarihindeki dolar/euro kuru tarayıcıdan frankfurter.dev üzerinden alınır (Avrupa Merkez Bankası referans kuru) |

Supabase ayarlanmadıysa uygulama yalnızca o cihazda çalışır; veriler tarayıcıda saklanır.

## Kurulum

### 1. GitHub Pages
Depo → **Settings → Pages** → *Source*: **Deploy from a branch** → *Branch*: **main**, klasör **/ (root)** → Save.
Birkaç dakika sonra adres: `https://<kullanıcı>.github.io/emanet/`

### 2. Fiyat işi
Depo → **Actions** sekmesi → iş akışlarını etkinleştirin → **Fiyatları güncelle → Run workflow** ile ilk çalıştırmayı başlatın.
Sonraki çalışmalar kendiliğinden olur.

### 3. Supabase (giriş ve eşitleme)
1. [supabase.com](https://supabase.com) üzerinde ücretsiz bir proje açın.
2. **SQL Editor** → `supabase/schema.sql` dosyasının içeriğini yapıştırıp çalıştırın.
3. **Authentication → URL Configuration** → *Site URL* alanına uygulamanın adresini yazın (`https://<kullanıcı>.github.io/emanet/`).
4. **Project Settings → API** sayfasındaki *Project URL* ve *anon public* anahtarını `js/config.js` dosyasına yazıp kaydedin.

`anon` anahtarı herkese açık olacak şekilde tasarlanmıştır; verileri RLS kuralları korur. `service_role` anahtarını **asla** depoya koymayın.

## Bilinmesi gerekenler

- İzlenen kodlar (ör. `THYAO`, `AAPL`) `emanet_watch` tablosunda ve `data/market.json` dosyasında herkese açıktır. Tutarlar ve kişisel veriler açık değildir.
- Fiyatlar canlı değildir: iş yarım saatte bir çalışır, kaynaklar da gecikmeli olabilir.
- TEFAS yurt dışı sunuculardan gelen istekleri zaman zaman reddeder. Fon fiyatı gelmezse uygulamada elle girilebilir; durum Ayarlar → *Son güncelleme* satırında görünür.
- Yİ-ÜFE endeksi `data/ufe.json` dosyasındadır ve ayda bir elle güncellenir (`idx` içine `"YYYY-AA": değer`, `latest` alanına son ay).
- Supabase kurulmadan kullanılıyorsa, fiyatı çekilecek kodlar `data/watchlist.json` dosyasına yazılır:
  `{"kodlar":[{"tur":"hisse","kod":"THYAO"},{"tur":"abd","kod":"AAPL"},{"tur":"fon","kod":"TTE"}]}`

## Yerelde çalıştırma

```bash
python3 -m http.server 8000   # sonra http://localhost:8000
node scripts/fetch-prices.mjs # fiyat betiğini elle dene
```

Derleme adımı yoktur; dosyalar olduğu gibi yayınlanır.

## Lisans

MIT

## Gün sonu bildirimi (isteğe bağlı)

Hafta içi her akşam 18:40 civarında, bildirimi açan cihazlara günlük kâr/zarar bildirimi gider.
Sunucu yalnızca içi boş bir "uyandırma" yollar; tutarlar telefonda hesaplanır ve cihazdan çıkmaz.

Kurulum (bir kez):

1. Supabase → SQL Editor'da `supabase/schema.sql` dosyasının sonundaki `emanet_push` bölümünü çalıştırın.
2. GitHub deposunda Settings → Secrets and variables → Actions → New repository secret:
   ad `VAPID_PRIVATE_KEY`, değer bildirim anahtarının gizli yarısı. Açık yarısı `js/config.js` içindeki `vapidPublicKey` değeridir.
3. Uygulamada Ayarlar → Bildirim → "Gün sonu bildirimi"ni açın (her cihazda ayrı). iPhone'da önce uygulamayı ana ekrana ekleyin.

Zamanlama `.github/workflows/notify.yml`, gönderim `scripts/send-push.mjs` dosyasındadır.

## Getiri karşılaştırması

Portföy sayfasındaki kart, portföyün getirisini aynı dönemde gram altın, dolar, BIST 100 ve enflasyonla (Yİ-ÜFE) karşılaştırır.
BIST 100 günlük kapanışları fiyat görevi tarafından `data/bench.json` dosyasına yazılır.
