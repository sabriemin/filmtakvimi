# Film Evreni Ağı

Film ve dizi evrenlerinin karakterlerini, olay örgüsünü, bağlantılarını, izleme sırasını ve gelecek vizyonlarını tek bir etkileşimli sitede birleştiren statik web uygulaması. Sunucu tarafı kod gerektirmez; `filmtakvimi.com/evren/` altına dosyaları yüklemek yeterlidir.

## Klasör yapısı

```
index.html                 Sayfa iskeleti
assets/app.css             Bütün stiller (tek tema, mobil öncelikli)
assets/app.js              Uygulama: hero, harita, zaman çizelgesi, rehber, karakterler, yakında, arama, yönlendirme
assets/config.js           Site sahibi bilgileri ve ayarlar  ← YAYINDAN ÖNCE DOLDURUN
assets/pages.js            Hakkımızda, İletişim, Gizlilik/KVKK, Çerez, Kullanım Koşulları, Yasal, Telif, Lisans, Erişilebilirlik
data/universes.json        Evren listesi (ad, renkler, amblem, slogan)
data/u/<evren>.json        Her evrenin yapımları, bağlantıları, karakterleri ve olayları
tools/dogrula.mjs          Veri doğrulayıcı
tools/tmdb-zenginlestir.mjs  Afiş, puan ve künye bilgilerini TMDB'den çeker
eski/prototip-v1.html      İlk prototip (arşiv)
```

## Yerelde çalıştırma

Veri dosyaları `fetch` ile yüklendiği için sayfayı doğrudan dosyadan (file://) açmak çalışmaz. Proje klasöründe:

```bash
python -m http.server 8765
```

Sonra tarayıcıda `http://localhost:8765` adresini açın.

## Yayına alma (filmtakvimi.com/evren)

1. `assets/config.js` içindeki köşeli parantezli alanları doldurun (site sahibi, adres, e-posta, KEP, hosting, yetkili mahkeme). Bu bilgiler yasal sayfalarda otomatik görünür.
2. Bütün klasörü (`index.html`, `assets/`, `data/`) sunucudaki `evren/` dizinine yükleyin. Adresin sonunda `/` olmalı: `filmtakvimi.com/evren/`.
3. İletişim formu şu anda önizleme modunda; mesaj göndermez. Bir form servisi (Formspree, Netlify Forms, kendi PHP betiğiniz vb.) bağlamak için `assets/app.js` içindeki `contactForm` bölümünü güncelleyin.
4. Yasal metinler bir başlangıç şablonudur; yayına almadan önce bir hukukçuya kontrol ettirmeniz önerilir.
5. Gizlilik açısından önerilen: Google Fonts ve D3 kütüphanesini kendi sunucunuzdan sunun (yurt dışına IP aktarımını azaltır) ve Gizlilik metnindeki 4. bölümü buna göre güncelleyin.

## Afişleri ekleme (TMDB)

Afişler, sahne görselleri ve TMDB puanı, ücretsiz bir TMDB API anahtarıyla bir kez çalıştırılan betikle eklenir:

1. https://www.themoviedb.org/settings/api adresinden ücretsiz anahtar alın ("API Read Access Token").
2. Proje klasöründe çalıştırın:

```bash
TMDB_TOKEN=anahtariniz node tools/tmdb-zenginlestir.mjs --kapaklar
```

Windows PowerShell'de önce `$env:TMDB_TOKEN="anahtariniz"` ile değişkeni tanımlayıp sonra `node tools/tmdb-zenginlestir.mjs --kapaklar` komutunu çalıştırın.

Betik her film ve dizi için TMDB'de arama yapar, `poster`, `backdrop`, `vote`, `tmdb` alanlarını veri dosyalarına yazar. Görseller TMDB'nin sunucusundan (`image.tmdb.org`) gösterilir. Kitap ve çizgi romanlar için `--kapaklar` seçeneği Open Library kapaklarını ekler. Görseli olmayan her yapım için site, evrenin renkleriyle kendi tipografik kapağını üretir. TMDB kullanım koşulları gereği footer'daki atıf satırını kaldırmayın.

Yanlış eşleşme olursa ilgili yapımın `tmdb` alanına doğru id'yi yazıp `--yeniden` ile tekrar çalıştırın.

## Veri modeli

Her `data/u/<evren>.json` dosyası:

| Alan | Açıklama |
|---|---|
| `intro` | Evrenin tanıtım paragrafı |
| `chronoLabel` | Evren içi zamanın birimi (ör. "BBY / ABY") |
| `lanes` | Haritadaki şeritler: `[id, ad]` |
| `titles` | Yapımlar (aşağıda) |
| `edges` | Bağlantılar: `[kaynak, hedef, tür, not]`; tür `devam`, `bagli`, `uyarlama` veya `gonderme` |
| `xref` | Evrenler arası bağlantılar: `[yapım, hedefEvren, hedefYapım, not]` |
| `chars` | Karakterler: `{id, name, actor, sum, app: [[yapım, rol]]}`; rol `ana`, `yan`, `cameo`, `anilir` |
| `events` | Olaylar: `{id, name, sum, at, aff: [[yapım, not]]}` |

Yapım alanları: `id`, `type` (`film`, `dizi`, `kitap`, `cizgi`), `name` (özgün ad), `tr` (Türkçe ad, isteğe bağlı), `date` (`YYYY-AA-GG` ya da `null`), `tent` (tarih kesin değilse `true`), `rt` (dakika), `eps` (diziler için), `lane`, `c` (kronoloji sıralama değeri), `cl` (kronoloji etiketi), `dir` (yönetmen/yaratıcı/yazar), `cast` (`[[oyuncu, rol]]`), `g` (türler), `sum` (özet), `sig` (evrendeki yeri). Gelecek yapımlar için `facts` (resmî bilgiler) ve `spec` (`[[düzey, metin]]`; düzey `beklenti`, `teori`, `söylenti`). Dizilerin yeni sezonu için `next: [etiket, tarih, kesinDeğilMi, not]`.

Her değişiklikten sonra doğrulayıcıyı çalıştırın:

```bash
node tools/dogrula.mjs
```

## Yeni evren ekleme

1. `data/universes.json` dosyasına bir satır ekleyin (`id`, `name`, `short`, `color`, `color2`, `emblem`, `tagline`; İngilizce adlı evrenler için `"lang":"en"`).
2. `data/u/<id>.json` dosyasını mevcut bir evreni örnek alarak oluşturun.
3. `node tools/dogrula.mjs` ile kontrol edin.

Kullanılabilir amblemler: `stones, suns, shield, bolt, ring, crown, dune, claw, flame, helix, egg, arrow, fossil, speed, fuse, coin, web, leaf, planet, bio`.

## Bağlantılar (derin link)

- `#mcu`: evreni açar
- `#mcu~doom`: Avengers: Doomsday detayını açar
- `#mcu~k-tony`: karakter sayfası
- `#gizlilik`, `#kosullar`, `#hakkimizda` …: kurumsal ve yasal sayfalar

## Bakım

Vizyon tarihleri sık değişir. `assets/config.js` içindeki `dataUpdated` tarihini her veri güncellemesinde değiştirin; sitede "veri güncellemesi" olarak gösterilir. Tarihi geçen yapımlar otomatik olarak "Yakında" listesinden çıkar ve haritadaki "Bugün" çizgisinin soluna geçer.
