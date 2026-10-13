# Film Evreni Ağı

Film ve dizi evrenlerinin karakterlerini, olay örgüsünü, bağlantılarını, izleme sırasını ve gelecek vizyonlarını tek bir etkileşimli sitede birleştiren web uygulaması. Telefonda uygulama gibi çalışır (PWA), kurumsal ve yasal sayfalar yönetim panelinden düzenlenir.

## Klasör yapısı

```
index.html                  Sayfa iskeleti
manifest.webmanifest        PWA tanımı (ana ekrana ekleme)
sw.js                       Servis çalışanı (çevrim dışı açılma, önbellek)
assets/app.css              Site stilleri
assets/app.js               Uygulama: hero, harita, zaman çizelgesi, rehber, karakterler, yakında, arama, menüler
assets/admin.js / .css      Yönetim paneli (yalnızca #yonetim açılınca yüklenir)
assets/icons/               Uygulama simgeleri (tools/ikon-uret.py ile üretilir)
api/cms.php                 Yönetim paneli için PHP kayıt arayüzü
api/ayar.php                Kurulum anahtarı ve ayarlar  ← YÜKLEMEDEN ÖNCE DÜZENLEYİN
data/universes.json         Evren listesi
data/u/<evren>.json         Yapımlar, bağlantılar, karakterler, olaylar (+ TMDB afiş/puan alanları)
data/site.json              Site sahibi ve iletişim bilgileri (panelden düzenlenir)
data/pages.json             Kurumsal ve yasal sayfalar, Markdown (panelden düzenlenir)
tools/dogrula.mjs           Veri doğrulayıcı
tools/tmdb-zenginlestir.mjs Afiş, arka plan, puan ve Türkçe vizyon adlarını TMDB'den çeker
tools/ikon-uret.py          Uygulama simgelerini üretir
```

## Yerelde çalıştırma

```bash
python -m http.server 8765
```

Yönetim panelini sunucu modunda denemek için PHP'nin yerleşik sunucusunu kullanın:

```bash
php -S 127.0.0.1:8799
```

## Yayına alma (filmtakvimi.com/evren)

1. Bütün klasörü sunucudaki `evren/` dizinine yükleyin. Adresin sonunda `/` olmalı: `filmtakvimi.com/evren/`.
2. Site HTTPS üzerinden açılmalı; PWA ve servis çalışanı yalnızca HTTPS'te çalışır.
3. `data/` klasörüne PHP'nin yazabilmesi gerekir (cPanel'de klasör izni genellikle 755 yeterlidir; gerekirse 775).

## Yönetim paneli

Sitede footer'daki **Yönetim** bağlantısı ya da `#yonetim` adresi paneli açar. Panel çalıştığı ortama göre kayıt yerini kendisi seçer:

| Ortam | Kayıt yeri | Kim düzenleyebilir |
|---|---|---|
| Kendi sunucunuz (PHP var) | `data/pages.json` ve `data/site.json`; her kayıttan önce `data/yedek/` altına yedek | Şifreyle giriş yapan yönetici |
| Claude yayın önizlemesi | Yayının kalıcı veritabanı | Yayının sahibi ve düzenleyicileri |
| PHP olmayan statik barındırma | Tarayıcıda taslak; dışa aktarıp `data/` klasörüne yükleyin | Herkes yalnızca kendi tarayıcısında |

### Sunucuda ilk kurulum

1. `api/ayar.php` dosyasındaki `kurulum_anahtari` değerini en az 12 karakterlik, tahmin edilemeyen bir metinle değiştirin.
2. Siteyi yükleyin ve `filmtakvimi.com/evren/#yonetim` adresini açın.
3. "İlk kurulum" ekranında kurulum anahtarını ve yeni yönetici şifrenizi (en az 10 karakter) girin.
4. Şifre, `api/.yonetici.php` dosyasında yalnızca özet (hash) olarak saklanır. Şifreyi sıfırlamak için bu dosyayı silip kurulumu tekrarlayın.

Güvenlik önlemleri: oturum çerezi `HttpOnly` ve `SameSite=Strict`, her kayıtta CSRF doğrulaması, IP başına 15 dakikada 6 hatalı giriş sınırı, gelen içeriğin alan alan süzülmesi, atomik dosya yazımı, son 30 kaydın yedeği. Sayfa içerikleri Markdown olarak saklanır ve ham HTML işlenmez.

### Sayfa içeriği (Markdown)

- `## Başlık`, `### Alt başlık`, `**kalın**`, `*italik*`, `- madde`, `1. madde`, `[metin](#gizlilik)`, `| tablo | satırı |`
- Değişkenler: `{{owner}}`, `{{address}}`, `{{email}}`, `{{kep}}`, `{{taxId}}`, `{{hosting}}`, `{{court}}`, `{{domain}}`, `{{name}}`, `{{analitik}}`
- Kısa kodlar: `[[kimlik]]` (veri sorumlusu kartı), `[[iletisim]]` (iletişim kutuları ve form), `[[cerez-sifirla]]`, `[[rozet:fact]]`, `[[rozet:beklenti]]`, `[[rozet:teori]]`, `[[rozet:söylenti]]`

Yasal metinler bir başlangıç şablonudur; yayına almadan önce bir hukukçuya kontrol ettirin. İletişim formu şu anda mesaj göndermez; bir form servisi bağlamak için `assets/app.js` içindeki `contactForm` bölümünü güncelleyin.

## Afişler ve TMDB

Afiş, arka plan görseli, TMDB puanı, TMDB özeti ve resmî Türkçe vizyon adları veri dosyalarına bir kez çekilir; görseller ziyaretçinin tarayıcısında doğrudan `image.tmdb.org` üzerinden gösterilir. API anahtarı sitenin kodunda yer almaz.

Yeni yapım ekledikten sonra:

```bash
TMDB_KEY=anahtariniz node tools/tmdb-zenginlestir.mjs --kapaklar
```

Windows PowerShell'de: `$env:TMDB_KEY="anahtariniz"; node tools/tmdb-zenginlestir.mjs --kapaklar`

Betik yalnızca afişi olmayan yapımları sorgular; `--yeniden` hepsini yeniler, `--evren mcu` tek evreni işler. Yıl tutmayan sonuçları eşleştirmez. Yanlış eşleşen bir yapımın `tmdb` alanına doğru id'yi yazıp `--yeniden --evren <id>` ile tekrar çalıştırın. Görsel sunucusuna erişilemeyen ortamlarda site otomatik olarak kendi tipografik kapaklarını kullanır. TMDB koşulları gereği footer'daki atıf satırını kaldırmayın.

## Veri modeli

Her `data/u/<evren>.json` dosyası:

| Alan | Açıklama |
|---|---|
| `intro` | Evrenin tanıtım paragrafı |
| `chronoLabel` | Evren içi zamanın birimi (ör. "BBY / ABY") |
| `lanes` | Haritadaki şeritler: `[id, ad]` |
| `titles` | Yapımlar |
| `edges` | `[kaynak, hedef, tür, not]`; tür `devam`, `bagli`, `uyarlama` veya `gonderme` |
| `xref` | Evrenler arası: `[yapım, hedefEvren, hedefYapım, not]` |
| `chars` | `{id, name, actor, sum, app: [[yapım, rol]]}`; rol `ana`, `yan`, `cameo`, `anilir` |
| `events` | `{id, name, sum, at, aff: [[yapım, not]]}` |

Yapım alanları: `id`, `type` (`film`, `dizi`, `kitap`, `cizgi`), `name`, `tr`, `date` (`YYYY-AA-GG` ya da `null`), `dp` (`"y"`: yalnızca yıl göster), `tent` (tarih kesin değil), `rt`, `eps`, `lane`, `c`, `cl`, `dir`, `cast`, `g`, `sum`, `sig`; gelecek yapımlar için `facts` ve `spec` (`[[düzey, metin]]`); dizinin yeni sezonu için `next: [etiket, tarih, kesinDeğilMi, not]`. TMDB betiği `tmdb`, `poster`, `backdrop`, `vote`, `tmdbOverview`, kitaplarda `cover` alanlarını ekler.

Gönderme notlarında "Jenerik sonrası", "Jenerik ortası", "Final", "Açılış" ya da "görünür/belirir" gibi ifadeler geçerse kart otomatik olarak uygun etiketle (Jenerik sonrası sahne, Gizli ayrıntı…) gösterilir.

Her değişiklikten sonra: `node tools/dogrula.mjs`

## Yeni evren ekleme

1. `data/universes.json` dosyasına bir satır ekleyin (`id`, `name`, `short`, `color`, `color2`, `emblem`, `tagline`; İngilizce adlı evrenler için `"lang":"en"`).
2. `data/u/<id>.json` dosyasını mevcut bir evreni örnek alarak oluşturun.
3. Evren seçicideki gruba eklemek için `assets/app.js` içindeki `GROUPS` listesini güncelleyin.
4. `node tools/dogrula.mjs`, ardından TMDB betiğini çalıştırın.

Amblemler: `stones, suns, shield, bolt, ring, crown, dune, claw, flame, helix, egg, arrow, fossil, speed, fuse, coin, web, leaf, planet, bio, lamp, castle, moon, goggle`.

## PWA

Site telefonda "Ana ekrana ekle" ile uygulama gibi açılır; alt sekme çubuğu ve alttan açılan paneller bu kullanım için tasarlandı. Servis çalışanı uygulama kabuğunu, bütün evren verilerini ve görüntülenen afişleri (en fazla 500) önbelleğe alır; site çevrim dışı da açılır. Yeni sürüm yayınladığınızda `sw.js` içindeki `SURUM` değerini artırın.

## Derin bağlantılar

`#mcu` (evren), `#mcu~doom` (yapım), `#mcu~k-tony` (karakter), `#gizlilik` (sayfa), `#yonetim` (panel).
