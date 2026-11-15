# Nedenmiş Studio — Sürüm notları

## v1.0.1 — paketleme düzeltmesi (Windows kurulumu)

**v1.0.0 kurulum dosyası açılışta `Cannot find package '@resvg/resvg-js'` hatası veriyordu.**
Nedeni: electron-builder, uygulama klasöründeki **her** `node_modules` dizinini koşulsuz dışlıyor
(`app-builder-lib/out/fileMatcher.js` → `!**/node_modules`). Çalışma zamanı modülleri
`dist-app/node_modules` içine konduğu için kurulan uygulamaya hiç girmiyordu; kök `package.json`'da
production `dependencies` olmadığından electron-builder'ın modül toplayıcısı da bir şey eklemiyordu.

Düzeltme:

- Çalışma zamanı modülleri artık `vendor/node_modules` altına hazırlanıp **`extraResources`** ile
  `resources/node_modules` olarak paketleniyor; Node, `resources/app/dist-app/server.mjs` dosyasından
  yukarı yürürken burayı buluyor.
- `@resvg/resvg-js` **ve** platforma özgü native eklenti (`@resvg/resvg-js-win32-x64-msvc`,
  `resvg.win32-x64-msvc.node`) birlikte paketleniyor; ikisinin de varlığı yapı sırasında doğrulanıyor.
- **Yapı kapısı:** `scripts/build-desktop.mjs`, `win-unpacked` üretildikten sonra zorunlu dosyaları
  (`server.mjs`, `ui/index.html`, `@resvg` + `.node`, `bin/ffmpeg.exe`, `bin/ffprobe.exe`,
  `python/python.exe`, `fonts/DejaVuSans.ttf`, `scripts/espeak_bridge.py`, `LICENSES.txt`) denetliyor;
  biri eksikse kurulum dosyası **hiç üretilmiyor**.
- **Çalışma zamanı kontrolü:** uygulama açılırken aynı bileşenleri doğruluyor; eksikse hangi modülün
  hangi yolda arandığını gösteren bir hata penceresi çıkıyor (belirsiz "servis başlamadı" yerine).
- **`--self-test`:** kurulu uygulama kendi kendini test edebiliyor — resvg'yi (native eklentiyle)
  yükleyip gerçek PNG üretiyor, FFmpeg/FFprobe/Python/fontları denetliyor, sunucuyu başlatıyor,
  proje oluşturup **gerçek MP4** üretiyor ve FFprobe ile doğruluyor. Rapor: `windows-install-test.json`.
- CI artık kurulum dosyasını **gerçekten kuruyor** (sessiz NSIS), kurulan uygulamayı çalıştırıp
  yukarıdaki testi koşuyor ve raporu yayına ekliyor. Test geçmeden yayın oluşturulmuyor.

## v1.0.0 — ilk yayın

### Ne yapar?

Konu → doğrulanmış bilgi kartı → Türkçe senaryo → sahne planı → sahne bazlı görsel doğrulama →
gerçek TTS → ölçülen süreye göre zamanlama → 1080×1920 MP4 → FFprobe doğrulaması.
Hepsi çevrimdışı, CPU'da, tek uygulamada.

### Öne çıkanlar

- **Konuya özgü görseller:** Görsel, konu adıyla değil kavram + mekanizma eşleşmesiyle seçilir.
  Elmas videosunda biyoloji görseli üretmek yapısal olarak engellenmiştir; mitokondri videosunda ise
  biyoloji görselleri doğru bağlamda kullanılır.
- **Açık reddetme:** 10 denetimli sahne doğrulaması. Hata varsa sahne `rejected` olur ve render kapısı
  `assertApproved` ile kapanır. Yanlış animasyon yayınlanmaz.
- **Dürüst zamanlama:** Anlatım süresi TTS'ten ölçülür; hedefin altında kalırsa sahne germek yerine konuşma
  temposu düşürülür (ikinci geçiş). %5 tolerans aşılırsa `DurationError` — sessiz kırpma yok.
- **Gerçek doğrulama:** FFprobe ile kare sayısı, süre, kodek, 48 kHz AAC, A/V senkron (<120 ms),
  sahne başına parlaklık/varyans ve kare örnekleri.
- **Stüdyo arayüzü:** Storyboard küçük resimleri (gerçek render motorundan), sahne bazlı anlatım düzenleme,
  görsel bileşen değiştirme, tek sahneyi yeniden üretme, canlı render ilerlemesi (SSE).
- **SQLite proje deposu:** `node:sqlite` (ek derleme gerekmez), yoksa JSON'a düşer ve bunu bildirir.
- **Masaüstü:** Electron kabuğu; Node, Python (eSpeak NG) ve FFmpeg paket içinde. Yönetici izni gerekmez.

### Bilinen sınırlar

- Bilgi tabanı **11 kuratörlü konu kartı** içerir; kartı olmayan konularda video üretilmez.
- Yayın örnekleri **eSpeak NG** ile seslendirilmiştir (robotik). **Chatterbox Multilingual** adaptörü
  kodda mevcut ve arayüzden seçilebilir, ancak bu derleme ortamında model ağırlıkları indirilemediği için
  gerçek çıktısı doğrulanamadı. Uygulama hiçbir zaman sessizce başka motora geçmez.
- Piper adaptörü hazır; Türkçe `.onnx` ses modeli paketle gelmez.
- 1080p render hedef donanımda (2 çekirdek) yaklaşık 4–5 kare/sn; 60 sn video ~6–8 dakika.
- Kurulum dosyası kod imzalı değildir (SmartScreen uyarısı normaldir).

### Kurulum

1. `NedenmisStudio-Setup.exe` → kur → uygulama açılır.
2. Taşınabilir: `NedenmisStudio-Portable.zip` → aç → `Nedenmiş Studio.exe`.

### Doğrulama ve şeffaflık

- `docs/scientific-validation.md` — hangi videoda hangi sahne, hangi görsel bileşen, hangi sonuç.
- `docs/test-report.md` — test sonuçları ve ölçüm ortamı.
- `samples/manifest.json` — her örnek için SHA-256, süre, kare sayısı, kodek, doğrulama durumu.
- `release/SHA256SUMS.txt` — yayın dosyalarının özetleri.

### Teşekkür

FFmpeg, resvg, eSpeak NG, DejaVu, Electron, React ve Vite projelerine.
