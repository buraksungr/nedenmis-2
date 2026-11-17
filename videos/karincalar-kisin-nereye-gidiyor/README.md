# Karıncalar Kışın Neden Ortadan Kaybolur? — Remotion belgesel shorts

60 sn · 1080×1920 (9:16) · 30 fps · Türkçe · MP4 (H.264 + AAC)

## Dosyalar

| Yol | İçerik |
| --- | --- |
| `src/` | Remotion kaynak kodu (tüm sahneler, karınca bileşeni, kamera, tipografi) |
| `src/script.ts` | Senaryo: anlatım metinleri, kapak yazıları, ses dosyaları |
| `src/timeline.ts` | **Otomatik üretilen** kare zaman çizelgesi (11 sahne, 1800 kare) |
| `audio/s1.wav … s10.wav` | Sahne sahne Türkçe anlatım (gerçek TTS) |
| `audio/master.wav` | Anlatım + ambiyans + geçiş sesleri karışımı (48 kHz stereo) |
| `public/fonts/` | Archivo / Archivo Black (woff2, latin + latin-ext) |
| `public/grain.png`, `vignette.png`, `glow.png` | Doku / vinyet / ışıma (üretilmiş) |
| `docs/script.md` | Senaryo + storyboard + bilimsel doğruluk notları |
| `docs/timeline.md` | Ölçülen sürelere göre sahne zaman çizelgesi |
| `docs/style-reference.md` | `image-1.png` görsel stil analizi ve palet |
| `docs/chatterbox-status.md` | Chatterbox denemesi ve dürüst sonuç |
| `reports/verification.json` | FFprobe doğrulama raporu |

## Çalıştırma

Gereksinimler: Node 22+, Remotion için Chromium (bu ortamda `@sparticuz/chromium`),
ve FFmpeg (`@remotion/compositor-linux-x64-gnu` içinde gelir).

```bash
npm install

# 1) zaman çizelgesi (ses süreleri ölçülür)
node --import tsx scripts/make-timeline.ts

# 2) ses tasarımı (anlatım + ambiyans)
node --import tsx scripts/audio.ts

# 3) video render (sessiz) — ortam değişkenleri gerekli
export LD_LIBRARY_PATH=/tmp/al2023/lib
export FONTCONFIG_PATH=/tmp/fonts
export CHROMIUM_PATH=/tmp/chromium
OUT=$(pwd)/out/video-silent.mp4 node --import tsx scripts/render.ts

# 4) ses + görüntü birleştir
node --import tsx scripts/mux.ts

# 5) doğrula (FFprobe)
node --import tsx scripts/verify.ts
```

Çıktı: `output/karincalar-kisin-nereye-gidiyor.mp4`

## Sahneler

`s1-hook` · `s2-merak` · `s3-sogukkanli` · `s4-metabolizma` · `s5-sekilme` ·
`s6-derinlik` · `s7-kralice` · `s8-kume` · `s9-turler` · `s10-ilkbahar` · `s11-kapanis`

Her sahne kendi kamera hareketini ve kompozisyonunu taşır; geçişler flash/parallax ile yapılır.
