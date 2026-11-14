# Kurulum ve ilk çalıştırma

## Gereksinimler

| | |
|---|---|
| İşletim sistemi | Windows 10 (1809+) veya Windows 11, x64 |
| CPU | 2 çekirdek / 4 iş parçacığı (hedef donanım: Intel i7‑7660U) |
| RAM | 4 GB (8 GB önerilir) |
| Disk | Kurulum ~450 MB, her 60 sn video ~15 MB |
| GPU | Gerekmez — tüm render CPU'da |
| İnternet | Gerekmez (eSpeak NG + FFmpeg gömülü) |

## Kurulum

1. `NedenmisStudio-Setup.exe` dosyasına çift tıklayın.
2. Windows SmartScreen uyarısı görürseniz **Ek bilgi → Yine de çalıştır** (kurulum dosyası kod imzalı değildir).
3. Kurulum türü: *yalnızca bu kullanıcı* (yönetici izni istemez). Klasörü değiştirebilirsiniz.
4. Kurulumdan sonra uygulama otomatik açılır; masaüstü ve başlat menüsü kısayolları oluşturulur.

Kaldırma: **Ayarlar → Uygulamalar → Nedenmiş Studio → Kaldır**. Projeleriniz varsayılan olarak
`%APPDATA%\Nedenmiş Studio\data` altında kalır (kaldırma sırasında silinmez).

## Taşınabilir sürüm

`NedenmisStudio-Portable.zip` dosyasını boş bir klasöre açın ve `Nedenmiş Studio.exe` dosyasını çalıştırın.
Veriler yine `%APPDATA%\Nedenmiş Studio\data` altında tutulur; farklı bir konum için `NEDENMIS_DATA`
ortam değişkenini ayarlayın.

## Paket içinde gelenler

```
Nedenmis Studio.exe
resources/
  app/            # arayüz (ui/), paketlenmiş sunucu (server.mjs), main.cjs
  bin/            # ffmpeg.exe, ffprobe.exe
  python/         # gömülü Python 3.11 + espeakng-loader (libespeak-ng)
  scripts/        # espeak_tts.py, chatterbox_server.py
  fonts/          # DejaVu Sans (altyazı/başlık çizimi için)
  LICENSES.txt
```

Node.js, Python ve FFmpeg'i ayrıca kurmanız gerekmez.

## İlk çalıştırma kontrol listesi

Ayarlar ekranında şunlar **yeşil** olmalı:

- FFmpeg / FFprobe — `resources/bin` içinden bulunur
- Yazı tipleri — `resources/fonts/DejaVuSans.ttf`
- eSpeak NG — gömülü Python üzerinden `libespeak-ng` yüklenebiliyor

Bir şey kırmızıysa uygulama sessizce devam etmez; seslendirme başlatıldığında açık hata gösterir.

## Sorun giderme

| Belirti | Neden / çözüm |
|---|---|
| “Yerel seslendirme (eSpeak NG) çalıştırılamadı” | Gömülü Python bulunamadı ya da antivirüs `python.exe`'yi engelledi. `resources\python` klasörünü istisnaya ekleyin; günlük: `%APPDATA%\Nedenmiş Studio\logs\studio.log` |
| “Konu en az 5 karakter olmalı” | Konu alanı boş. |
| “Bu konu için doğrulanmış bilgi kartı yok” | v1.0'da 11 kuratörlü konu var; önerilen kartlar listede gösterilir. |
| Video çok yavaş üretiliyor | Kaliteyi **Taslak** yapın (540p, hızlı). 1080p için hedef donanımda ~6–10 dk/60 sn. |
| Kurulumda “Windows korumalı bilgisayarınızı korudu” | İmzasız dağıtım; *Ek bilgi → Yine de çalıştır*. |
| Ekran boş açılıyor | Yerel servis başlamamış olabilir; `%APPDATA%\Nedenmiş Studio\logs\studio.log` dosyasına bakın, uygulamayı yeniden başlatın. |

## Geliştirici kurulumu

```powershell
git clone https://github.com/buraksungr/nedenmis-2
cd nedenmis-2
npm ci
npm run build
npm run studio          # http://127.0.0.1:5319
```

Windows'ta gömülü Python olmadan da çalışır: sistemdeki Python'da `pip install espeakng-loader`
yeterlidir (uygulama `.venv`, `NEDENMIS_PYTHON` ve sistem Python'unu sırayla dener).
