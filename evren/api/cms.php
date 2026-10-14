<?php
/*
 * Film Evreni Ağı — yönetim paneli sunucu arayüzü (PHP 8.0+).
 * Kurumsal/yasal sayfaları (data/pages.json) ve site bilgilerini (data/site.json) güvenli biçimde günceller.
 *
 * Uç noktalar (api/cms.php?a=...):
 *   durum       GET   kurulum ve oturum durumu
 *   kurulum     POST  {anahtar, sifre}  ilk yönetici şifresini belirler (yalnızca bir kez)
 *   giris       POST  {sifre}
 *   cikis       POST
 *   kaydet      POST  {site, pages}      oturum + CSRF gerekir; önce yedek alır
 *   yedekler    GET   oturum gerekir
 *   geri-yukle  POST  {ad}               oturum + CSRF gerekir
 */
declare(strict_types=1);

$AYAR = require __DIR__ . '/ayar.php';
$VERI = rtrim($AYAR['veri_dizini'], '/\\');
$YEDEK = $VERI . '/yedek';
$SIFRE_DOSYASI = __DIR__ . '/.yonetici.php'; // PHP dosyası: doğrudan istenirse çalışır ve hiçbir şey göstermez

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_name('fea_admin');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
session_start();

function cevap(array $d, int $kod = 200): void { http_response_code($kod); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function govde(): array {
    $raw = file_get_contents('php://input', false, null, 0, 2000000);
    if ($raw === false || $raw === '') return [];
    $j = json_decode($raw, true);
    if (!is_array($j)) cevap(['hata' => 'Geçersiz JSON'], 400);
    return $j;
}
function post(): void { if ($_SERVER['REQUEST_METHOD'] !== 'POST') cevap(['hata' => 'POST gerekli'], 405); }
function girisli(): bool {
    global $AYAR;
    if (empty($_SESSION['giris'])) return false;
    if (($_SESSION['son'] ?? 0) < time() - (int)$AYAR['oturum_suresi']) { session_unset(); return false; }
    $_SESSION['son'] = time();
    return true;
}
function csrf(): void { if (empty($_SESSION['csrf']) || !hash_equals((string)$_SESSION['csrf'], (string)($_SERVER['HTTP_X_CSRF'] ?? ''))) cevap(['hata' => 'Oturum doğrulanamadı; sayfayı yenileyip tekrar deneyin'], 403); }
function yetkili(): void { if (!girisli()) cevap(['hata' => 'Giriş yapmanız gerekiyor'], 401); }

/* Basit deneme sınırı: IP başına 15 dakikada 6 hatalı giriş */
function sinirDosyasi(): string { return sys_get_temp_dir() . '/fea_giris_' . hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'x') . '.json'; }
function sinirKontrol(): void {
    $f = sinirDosyasi(); $d = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
    $d = array_values(array_filter($d, fn($t) => $t > time() - 900));
    if (count($d) >= 6) cevap(['hata' => 'Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.'], 429);
}
function sinirEkle(): void {
    $f = sinirDosyasi(); $d = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
    $d[] = time(); @file_put_contents($f, json_encode($d), LOCK_EX);
}

function yaz(string $yol, string $icerik): void {
    $tmp = $yol . '.tmp' . bin2hex(random_bytes(4));
    if (file_put_contents($tmp, $icerik, LOCK_EX) === false || !rename($tmp, $yol)) { @unlink($tmp); cevap(['hata' => 'Dosya yazılamadı: ' . basename($yol) . ' (yazma izinlerini kontrol edin)'], 500); }
}
function yedekAl(): string {
    global $VERI, $YEDEK;
    if (!is_dir($YEDEK)) { mkdir($YEDEK, 0750, true); file_put_contents($YEDEK . '/.htaccess', "Require all denied\n"); }
    $ad = date('Ymd-His') . '-' . bin2hex(random_bytes(2));
    mkdir($YEDEK . '/' . $ad, 0750);
    foreach (['pages.json', 'site.json'] as $f) if (is_file("$VERI/$f")) copy("$VERI/$f", "$YEDEK/$ad/$f");
    $hepsi = glob($YEDEK . '/*', GLOB_ONLYDIR) ?: [];
    rsort($hepsi);
    foreach (array_slice($hepsi, 30) as $eski) { array_map('unlink', glob($eski . '/*') ?: []); @rmdir($eski); }
    return $ad;
}
function metin($v, int $max): string { if (!is_string($v)) $v = ''; $v = str_replace("\0", '', $v); return mb_substr($v, 0, $max); }

$a = $_GET['a'] ?? 'durum';
switch ($a) {
    case 'durum':
        cevap(['kurulu' => is_file($SIFRE_DOSYASI), 'oturum' => girisli(), 'csrf' => girisli() ? $_SESSION['csrf'] : null]);

    case 'kurulum':
        post();
        if (is_file($SIFRE_DOSYASI)) cevap(['hata' => 'Kurulum zaten yapılmış'], 409);
        sinirKontrol();
        $b = govde();
        $anahtar = (string)$AYAR['kurulum_anahtari'];
        if (strlen($anahtar) < 12 || str_contains($anahtar, 'DEGISTIRIN')) cevap(['hata' => 'Önce api/ayar.php dosyasındaki kurulum anahtarını değiştirin'], 400);
        if (!hash_equals($anahtar, (string)($b['anahtar'] ?? ''))) { sinirEkle(); cevap(['hata' => 'Kurulum anahtarı hatalı'], 403); }
        $sifre = (string)($b['sifre'] ?? '');
        if (mb_strlen($sifre) < 10) cevap(['hata' => 'Şifre en az 10 karakter olmalı'], 400);
        yaz($SIFRE_DOSYASI, "<?php
return " . var_export(['hash' => password_hash($sifre, PASSWORD_DEFAULT), 'tarih' => date('c')], true) . ";
");
        @chmod($SIFRE_DOSYASI, 0600);
        cevap(['tamam' => true]);

    case 'giris':
        post(); sinirKontrol();
        if (!is_file($SIFRE_DOSYASI)) cevap(['hata' => 'Önce kurulum yapın'], 400);
        $b = govde();
        $kayit = require $SIFRE_DOSYASI;
        if (!is_array($kayit) || !password_verify((string)($b['sifre'] ?? ''), (string)($kayit['hash'] ?? ''))) { sinirEkle(); usleep(400000); cevap(['hata' => 'Şifre hatalı'], 401); }
        session_regenerate_id(true);
        $_SESSION['giris'] = true; $_SESSION['son'] = time(); $_SESSION['csrf'] = bin2hex(random_bytes(32));
        cevap(['oturum' => true, 'csrf' => $_SESSION['csrf']]);

    case 'cikis':
        post(); $_SESSION = []; session_destroy();
        cevap(['tamam' => true]);

    case 'kaydet':
        post(); yetkili(); csrf();
        $b = govde();
        $izinli = ['name' => 120, 'domain' => 120, 'baseUrl' => 300, 'owner' => 300, 'address' => 500, 'email' => 200, 'kep' => 200, 'taxId' => 120, 'hosting' => 300, 'court' => 300, 'dataUpdated' => 10, 'tmdbImageBase' => 200];
        $mevcutSite = is_file("$VERI/site.json") ? (json_decode((string)file_get_contents("$VERI/site.json"), true) ?: []) : [];
        $site = $mevcutSite;
        foreach ($izinli as $k => $max) if (isset($b['site'][$k])) $site[$k] = metin($b['site'][$k], $max);
        $site['analytics'] = !empty($b['site']['analytics']);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($site['dataUpdated'] ?? ''))) $site['dataUpdated'] = date('Y-m-d');
        if (!isset($b['pages']) || !is_array($b['pages']) || count($b['pages']) > 60) cevap(['hata' => 'Sayfa listesi geçersiz'], 400);
        $sayfalar = []; $anahtarlar = [];
        foreach ($b['pages'] as $p) {
            $key = metin($p['key'] ?? '', 40);
            if (!preg_match('/^[a-z0-9-]{2,40}$/', $key) || isset($anahtarlar[$key])) cevap(['hata' => "Geçersiz ya da yinelenen sayfa adresi: $key"], 400);
            $anahtarlar[$key] = true;
            $grup = in_array($p['group'] ?? '', ['Kurumsal', 'Yasal'], true) ? $p['group'] : 'Kurumsal';
            $baslik = trim(metin($p['title'] ?? '', 160));
            if ($baslik === '') cevap(['hata' => "Başlığı boş sayfa: $key"], 400);
            $sayfalar[] = [
                'key' => $key, 'group' => $grup, 'order' => max(0, min(99, (int)($p['order'] ?? 0))),
                'title' => $baslik, 'lead' => metin($p['lead'] ?? '', 3000), 'body' => metin($p['body'] ?? '', 60000),
                'updated' => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($p['updated'] ?? '')) ? $p['updated'] : date('Y-m-d'),
                'footer' => ($p['footer'] ?? true) !== false
            ];
        }
        $yedek = yedekAl();
        $bayrak = JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
        yaz("$VERI/site.json", json_encode($site, $bayrak) . "\n");
        yaz("$VERI/pages.json", json_encode(['pages' => $sayfalar], $bayrak) . "\n");
        cevap(['tamam' => true, 'yedek' => $yedek, 'csrf' => $_SESSION['csrf']]);

    case 'yedekler':
        yetkili();
        $liste = [];
        foreach (array_reverse(glob($YEDEK . '/*', GLOB_ONLYDIR) ?: []) as $d) {
            $ad = basename($d);
            $t = DateTime::createFromFormat('Ymd-His', substr($ad, 0, 15));
            $liste[] = ['ad' => $ad, 'tarih' => $t ? $t->format('d.m.Y H:i:s') : ''];
        }
        cevap(['yedekler' => $liste, 'csrf' => $_SESSION['csrf']]);

    case 'geri-yukle':
        post(); yetkili(); csrf();
        $b = govde(); $ad = (string)($b['ad'] ?? '');
        if (!preg_match('/^\d{8}-\d{6}-[0-9a-f]{4}$/', $ad) || !is_dir("$YEDEK/$ad")) cevap(['hata' => 'Yedek bulunamadı'], 404);
        yedekAl();
        foreach (['pages.json', 'site.json'] as $f) if (is_file("$YEDEK/$ad/$f")) yaz("$VERI/$f", (string)file_get_contents("$YEDEK/$ad/$f"));
        cevap(['tamam' => true, 'csrf' => $_SESSION['csrf']]);

    default:
        cevap(['hata' => 'Bilinmeyen işlem'], 404);
}
