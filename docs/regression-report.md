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
| Windows kurulum dosyası + kurulu uygulama `--self-test` | CI: sessiz NSIS kurulumu + kurulu uygulama testi | ⏳ CI çalıştırması |
| v1.0.1 paketleme düzeltmesi (`resources/node_modules`, `@resvg/resvg-js`) | CI: yapı kapısı + kurulu uygulama resvg testi | ⏳ CI çalıştırması |
| Gömülü Python + eSpeak NG + FFmpeg | CI: `npm run smoke` (gerçek TTS) | ⏳ CI çalıştırması |

## Yerel ölçümler (bu ortam)

- Node 22.22.3, 2 vCPU, 3.8 GB RAM, GPU yok.
- `npm test` → **34/34 geçti** (20 mevcut + 14 yeni).
- `npm run test:e2e` → geçti. Not: bu konteynerde eSpeak NG/Python köprüsü bulunmadığı için
  `NEDENMIS_E2E_ENGINE=silent` ile çalıştırıldı; **görüntü, FFmpeg, FFprobe, .srt ve doğrulama gerçek**,
  ses sessiz. Bu durum raporda gizlenmez; gerçek sesli doğrulama CI'da `npm run smoke` ile yapılır.
- `npm run test:ui` → 13/13 kontrol geçti (monokrom CSS dahil).
- `node scripts/script-compare.mjs` → 4 konuda sade anlatım eskisinden belirgin biçimde kısa
  (bkz. `docs/before-after-script.md`).
- `node scripts/ui-shots.mjs` → bu ortamda tarayıcı yok; betik "alınamadı" diye raporlar
  (`reports/ui-screenshots.json`). Ekran görüntüleri Windows CI'da üretilir.
- `python scripts/chatterbox-verify.py` → `outcome: "not-installed"` (torch/HuggingFace yok).
  Gerçek Türkçe sentez CI'da isteğe bağlı adımda denenir; sonuç `reports/chatterbox-tr.json`'a yazılır.

## Değişmeyen sözleşmeler

- `POST /api/projects` gövdesi **geriye dönük uyumlu**: yeni alanlar (`languageLevel`,
  `visualComplexity`, `subtitles`) isteğe bağlı; verilmezse Sade dil ve altyazı açık varsayılır.
- Proje şeması yalnızca **ek alanlar** kazandı (`languageLevel`, `scriptQuality`, `visualComplexity`,
  `exportSettings.subtitles`, `scene.narrationScientific`, `scene.narration` sade metni taşır).
  Eski projeler yüklenebilir; eksik alanlar varsayılanla tamamlanır.
- Render çıktıları aynı: 1080×1920 (taslak 540×960), H.264 + AAC 48 kHz, 30 fps.
