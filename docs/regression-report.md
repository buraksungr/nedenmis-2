# Regresyon raporu — v1.1.0

Amaç: yeni içerik/arayüz çalışmasının **var olan üretim hattını bozmadığını** kanıtlamak.
Bu tablo yalnızca gerçekten çalıştırılan kontrolleri listeler; her satırın komutu yeniden çalıştırılabilir.

## Korunması gereken yetenekler ve durumu

| Yetenek | Kontrol | Durum |
| --- | --- | --- |
| Render hattı (SVG → PNG → FFmpeg → MP4) | `npm run test:e2e` (gerçek FFmpeg/FFprobe, 40 kare) | ✅ geçti |
| Görsel doğrulama kapısı (10 denetim, reddedilen sahne render'ı durdurur) | `tests/unit/visual-validation.test.ts` + `tests/unit/script-quality.test.ts` | ✅ geçti |
| 41 görsel bileşenin tamamı geçerli SVG üretir | `tests/unit/components.test.ts` | ✅ geçti |
| ±%5 süre toleransı / `DurationError` | `tests/unit/timeline.test.ts` | ✅ geçti |
| Proje deposu (SQLite/JSON) yazma-okuma-silme | `tests/unit/storage.test.ts` | ✅ geçti |
| Bilgi kartı bütünlüğü + konu çözümleme | `tests/unit/ontology.test.ts` | ✅ geçti |
| Altyazı (.srt) üretimi | `npm run test:e2e` (srt dosyası varlığı) | ✅ geçti |
| Arayüz çalışma zamanı (ekranlar, menü, ayarlar) | `npm run test:ui` (jsdom, 13 kontrol) | ✅ geçti |
| Tek renk tema (renkli ton yok) | `npm run test:ui` → `monochrome` (derlenmiş CSS doygunluk ölçümü) | ✅ geçti |
| Sade dil varsayılanı + kalite kapısı | `tests/unit/script-quality.test.ts` (14 test) | ✅ geçti |
| Windows kurulum dosyası + kurulu uygulama `--self-test` | CI: sessiz NSIS kurulumu + kurulu uygulama testi | ✅ geçti (run 44000926527, 28/28 adım) |
| v1.0.1 paketleme düzeltmesi (`resources/node_modules`, `@resvg/resvg-js`) | CI: yapı kapısı + kurulu uygulama resvg testi | ✅ geçti |
| Gömülü Python + eSpeak NG + FFmpeg | CI: `npm run smoke` (gerçek TTS) | ✅ geçti |
| Örnek videolar (4 zorunlu konu, sade dil, gerçek eSpeak, 1080×1920/30 sn) | CI: `render-samples` + `verify-samples` | ✅ geçti |
| Arayüz ekran görüntüleri (gerçek Chrome, 1600×1000, 4 ekran) | CI: `node scripts/ui-shots.mjs` | ✅ 4/4 çekim, krom tek renk |
| Palet denetimi (kaynak düzeyi) | `npm run check:colors` | ✅ renkli değer yok |
| Chatterbox Türkçe sentez (gerçek model, CPU) | CI: `scripts/chatterbox-verify.py` | ✅ `ok: true` — 4,92 sn PCM16 WAV, sessizlik %6,1, RTF 6,9× |

## CI'da koşan tam kontrol listesi (çalıştırma 44000926527 · 28/28 adım)

| # | Adım | Sonuç |
|---|------|-------|
| 1–3 | checkout, node 22, bağımlılıklar | ✅ |
| 4 | derleme (core + server + ui) | ✅ |
| 5 | tip denetimi | ✅ |
| 6 | birim testleri (34) | ✅ |
| 7 | gömülü Python + eSpeak NG | ✅ |
| 8 | arayüz duman testi (jsdom, 13 kontrol) | ✅ |
| 9 | senaryo öncesi/sonrası ölçümü | ✅ |
| 10 | ekran görüntüleri (gerçek Chrome, 4 ekran) | ✅ `ok: true`, 4/4 |
| 11 | palet denetimi | ✅ renkli değer yok |
| 12 | simge üretimi | ✅ |
| 13 | üretim duman testi (gerçek TTS + FFprobe) | ✅ |
| 14 | 4 zorunlu örnek video (30 sn, sade dil) | ✅ |
| 15 | masaüstü paketi + NSIS kurulum dosyası | ✅ |
| 16 | sessiz NSIS kurulumu | ✅ (2. denemede; 1. deneme `0xC0000005`, yeniden deneme devrede) |
| 17 | kurulu uygulama testi (`--self-test`) | ✅ |
| 18 | kurulum testi raporu (markdown) | ✅ |
| 19–21 | taşınabilir zip, kaynak zip, SHA-256 | ✅ |
| 22 | örnek doğrulama (6/6) | ✅ |
| 23 | Chatterbox Türkçe sentez (gerçek model, CPU) | ✅ `outcome: synthesized` |
| 24–26 | artefaktlar, tanı günlükleri, özet | ✅ |
| 27 | yayın oluşturma | ✅ |

**Atlanan adım yok.** Tek uyarı: actions/*@v4 için Node 20 kullanım dışı bildirimi (işlevi etkilemez).

## Yerel ölçümler (bu ortam)

- Node 22.22.3, 2 vCPU, 3.8 GB RAM, GPU yok.
- `npm test` → **34/34 geçti** (20 mevcut + 14 yeni).
- `npm run test:e2e` → geçti. Not: bu konteynerde eSpeak NG/Python köprüsü bulunmadığı için
  `NEDENMIS_E2E_ENGINE=silent` ile çalıştırıldı; **görüntü, FFmpeg, FFprobe, .srt ve doğrulama gerçek**,
  ses sessiz. Bu durum raporda gizlenmez; gerçek sesli doğrulama CI'da `npm run smoke` ile yapılır.
- `npm run test:ui` → 13/13 kontrol geçti (monokrom CSS dahil).
- `node scripts/script-compare.mjs` → 4 konuda sade anlatım eskisinden belirgin biçimde kısa
  (bkz. `docs/before-after-script.md`).
- `node scripts/ui-shots.mjs` → bu ortamda tarayıcı yok; betik "alınamadı" diye raporlar.
  Betiğin mantığı saplama bir tarayıcıyla uçtan uca doğrulandı (4/4 çekim, 1600×1000, krom tek renk);
  gerçek ekran görüntüleri Windows CI'da üretilir ve yayına eklenir.
- `python scripts/chatterbox-verify.py` → bu konteynerde `outcome: "not-installed"` (torch/HuggingFace yok).
  WAV çözümleyicisi float32/PCM16/PCM32 örnekleriyle ayrıca sınandı (üçünde de doğru süre/tepe/RMS).
  Gerçek Türkçe sentez CI'da üretildi: `chatterbox-tr.json` → `ok: true`.

## Değişmeyen sözleşmeler

- `POST /api/projects` gövdesi **geriye dönük uyumlu**: yeni alanlar (`languageLevel`,
  `visualComplexity`, `subtitles`) isteğe bağlı; verilmezse Sade dil ve altyazı açık varsayılır.
- Proje şeması yalnızca **ek alanlar** kazandı (`languageLevel`, `scriptQuality`, `visualComplexity`,
  `exportSettings.subtitles`, `scene.narrationScientific`, `scene.narration` sade metni taşır).
  Eski projeler yüklenebilir; eksik alanlar varsayılanla tamamlanır.
- Render çıktıları aynı: 1080×1920 (taslak 540×960), H.264 + AAC 48 kHz, 30 fps.
