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
| Fiyatlar | `.github/workflows/prices.yml` 10 dakikada bir (Supabase zamanlayıcısıyla tetiklenir) `scripts/fetch-prices.mjs` betiğini çalıştırır, sonucu `data/market.json` dosyasına yazar |
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
- Fiyatlar canlı değildir: iş 10 dakikada bir çalışır; fiyat dosyaları `fiyat` dalında durur, kaynaklar da gecikmeli olabilir.
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

## Bildirimler (isteğe bağlı)

Gün sonu özeti, haftalık ve aylık özet ile büyük hareket uyarısı. Her cihaz kendi saatini ve hangi bildirimleri
istediğini Ayarlar → Bildirim'den seçer. Sunucu yalnızca içi boş bir "uyandırma" yollar; bildirimin metni telefonda
hesaplanır, tutarlar cihazdan çıkmaz. Büyük hareket uyarısı için yalnızca portföyün yüzde dağılımı saklanır.

Kurulum (bir kez):

1. Supabase → SQL Editor'da `supabase/schema.sql` dosyasının sonundaki "Bildirimler" bölümünü çalıştırın.
2. GitHub deposunda Settings → Secrets and variables → Actions → New repository secret:
   ad `VAPID_PRIVATE_KEY`, değer bildirim anahtarının gizli yarısı. Açık yarısı `js/config.js` içindeki `vapidPublicKey` değeridir.
   Anahtar değişirse `schema.sql` içindeki iki işlevde yazan özet (sha256) de değişmelidir.
3. Uygulamada Ayarlar → Bildirim'den açın (her cihazda ayrı). iPhone'da önce uygulamayı ana ekrana ekleyin.

Bildirimler "Fiyatları güncelle" işinin sonunda `scripts/send-push.mjs` ile gönderilir; bu yüzden zamanında gelmeleri
o işin düzenli çalışmasına bağlıdır. "Bildirim denemesi" işi (Actions sekmesi) ayarlara bakmadan herkese bir bildirim yollar.

## Canlı fiyat (isteğe bağlı)

Fiyat dosyası 10 dakikada bir güncellenir. Uygulama açıkken 30 saniyede bir son fiyatları da almak için Supabase'e küçük bir Edge Function kurun:

1. Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Adını `fiyat` yapın, `supabase/functions/fiyat/index.ts` dosyasının içeriğini yapıştırıp **Deploy** deyin.
3. Fonksiyonun ayarlarında **Verify JWT** (JWT doğrulaması) seçeneğini kapatın.

Kurulu değilse uygulama dosyadaki fiyatlarla çalışmaya devam eder. BIST fiyatları kaynağında yaklaşık 15 dakika gecikmelidir.

## Portföy paylaşımı

Bir portföyü başka bir e-posta adresiyle paylaşabilirsiniz (Portföy → Düzenle → Paylaşım). Paylaşılan kişi o e-postayla giriş yaptığında portföyü kendi ekranında salt okunur görür; değişiklik yapamaz. Bütçe, borçlar ve zekât paylaşılmaz. Sahibi portföyü her güncellediğinde paylaşılan kopya da güncellenir.

Kurulum için Supabase → SQL Editor'de `supabase/schema.sql` dosyasının "Portföy paylaşımı" bölümünü bir kez çalıştırın.

## Getiri karşılaştırması

Portföy sayfasındaki kart, portföyün getirisini aynı dönemde gram altın, dolar, BIST 100 ve enflasyonla (Yİ-ÜFE) karşılaştırır.
BIST 100 günlük kapanışları fiyat görevi tarafından `data/bench.json` dosyasına yazılır.

## Fişten okuma

"İşlem ekle" penceresindeki "Fişten doldur" düğmesi fişin fotoğrafını telefonda okur; fotoğraf cihazdan çıkmaz.
Okuma için [Tesseract.js](https://github.com/naptha/tesseract.js) (Apache 2.0) ve Türkçe dil verisi `js/vendor/tesseract/` klasöründe depoyla birlikte gelir.
