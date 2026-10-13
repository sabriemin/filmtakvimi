<?php
/*
 * Yönetim paneli ayarları. Sunucuya yüklemeden ÖNCE kurulum anahtarını değiştirin:
 * en az 12 karakterlik, tahmin edilemeyen bir metin yazın (ör. bir parola yöneticisinin ürettiği bir dize).
 * Bu anahtar yalnızca ilk yönetici şifresini belirlerken bir kez sorulur.
 */
return [
    'kurulum_anahtari' => 'DEGISTIRIN-bunu-uzun-ve-rastgele-bir-metinle',
    'veri_dizini' => __DIR__ . '/../data',
    'oturum_suresi' => 7200, // saniye; işlem yapılmazsa 2 saat sonra oturum kapanır
];
