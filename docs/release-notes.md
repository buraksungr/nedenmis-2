# Nedenmiş Studio — Sürüm notları

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
