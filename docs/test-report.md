# Test raporu — Nedenmiş Studio v1.1.0

Son doğrulanan çalıştırma: **GitHub Actions 44006936005** (commit `ff306e5`, etiket `v1.1.0`)
Aynı sürüm daha önce 43994410308 ve 44000926527 çalıştırmalarında da 28/28 geçti.
Sonuç: **28/28 adım başarılı**, yayın oluşturuldu.

## Otomatik testler (bu çalıştırmada gerçekten koşanlar)

| Takım | Komut / adım | Sonuç |
|---|---|---|
| Birim testleri (34 test) | `npm test` | ✅ 34/34 (0 atlandı, 0 başarısız) |
| Uçtan uca üretim (TTS + FFmpeg + FFprobe, 40 kare) | `npm run test:e2e` (CI'da gerçek eSpeak NG) | ✅ geçti |
| Tip denetimi (core + server + ui) | `npm run typecheck` | ✅ geçti |
| Arayüz duman testi (jsdom + gerçek API) | `npm run test:ui` | ✅ 13/13 kontrol |
| Arayüz paleti (kaynak düzeyi tek renk kuralı) | `npm run check:colors` | ✅ 14 dosya, renkli değer yok |
| Arayüz ekran görüntüleri (gerçek Chrome, 1600×1000) | `node scripts/ui-shots.mjs` | ✅ 4/4 çekim; krom `monochrome: true` |
| Senaryo öncesi/sonrası ölçümü | `node scripts/script-compare.mjs` | ✅ 4 konu (`docs/before-after-script.md`) |
| Gerçek üretim duman testi (gömülü Python + eSpeak + FFmpeg) | `npm run smoke` | ✅ geçti (`reports/smoke-windows.json`) |
| Örnek video üretimi (4 zorunlu konu, sade dil, 1080×1920, 30 sn) | `render-samples` | ✅ 4/4 |
| Örnek doğrulama (FFprobe, 6 dosya) | `verify-samples` | ✅ 6/6, sapmalar −3.22…+4.56 % (tolerans ±5 %) |
| Masaüstü paketleme + NSIS kurulum dosyası | electron-builder | ✅ `NedenmisStudio-Setup.exe` (143,1 MB) |
| Sessiz NSIS kurulumu | `Setup.exe /S /D=C:\nedenmis-test` | ✅ kuruldu (bu çalıştırmada 1. denemede; 44000926527'de 1. deneme `0xC0000005` idi ve yeniden deneme devreye girdi) |
| Kurulu uygulama testi (`--self-test`: resvg + FFmpeg + gömülü Python + gerçek MP4 + FFprobe) | kurulu exe | ✅ geçti (`reports/windows-install-test.json`) |
| Taşınabilir zip / kaynak zip / SHA-256 | `build:desktop`, `build:source-zip`, `checksums` | ✅ |
| Chatterbox Türkçe sentez (gerçek model, CPU) | `chatterbox-verify.py` | ✅ `ok: true`, `outcome: synthesized` |

**Hiçbir testte mock yok:** TTS, FFmpeg/FFprobe, kurulum ve ekran görüntüleri gerçek araçlarla çalıştı.
Tek istisna, bu konteynerde yapılan yerel e2e denemesi: burada eSpeak/Python köprüsü bulunmadığı için
sessiz motor açıkça seçildi (`NEDENMIS_E2E_ENGINE=silent`); görüntü/FFmpeg/altyazı/doğrulama gerçekti.
CI'da aynı test **gerçek eSpeak NG** ile koştu.

## Üretilen örnekler (yayındaki dosyalar, FFprobe ile doğrulandı)

| Konu | Dosya | Süre | Kare | Çözünürlük | Ses |
|---|---|---|---|---|---|
| Yeni elmas neden kolay kırılmaz? | `elmas-neden-kirilmaz-30s.mp4` | 31,03 sn (+3,45 %) | 931 | 1080×1920 | AAC 48 kHz |
| Gökyüzü neden mavi? | `gokyuzu-neden-mavi-30s.mp4` | 29,03 sn (−3,22 %) | 871 | 1080×1920 | AAC 48 kHz |
| Denizler neden tuzlu? | `denizler-neden-tuzlu-30s.mp4` | 29,97 sn (−0,11 %) | 899 | 1080×1920 | AAC 48 kHz |
| Kara delikler nasıl çalışır? | `kara-delik-nedir-30s.mp4` | 29,63 sn (−1,22 %) | 889 | 1080×1920 | AAC 48 kHz |
| Metaller neden iletken? | `metaller-neden-iletken-60s.mp4` | 62,73 sn (+4,56 %) | 1882 | 1080×1920 | AAC 48 kHz |
| Mitokondri neden önemli? | `mitokondri-neden-onemli-60s.mp4` | 62,00 sn (+3,33 %) | 1860 | 1080×1920 | AAC 48 kHz |

Dört zorunlu konu **sade dil** düzeyinde, gerçek eSpeak NG sesiyle, 30 sn hedefiyle CI'da
yeniden üretildi; ölçülen süreler **ölçülen** anlatım sürelerinden hesaplandı (kırpma yok).

## Chatterbox (gerçek sentez, CPU)

| Ölçüm | Değer |
|---|---|
| Paket / dil | chatterbox-tts 0.1.7 · 23 dil · `tr` |
| Metin | “Elmas neden kolay kırılmaz? Serttir, ama yine de kırılabilir.” |
| Ses | 4,28 sn · 24 kHz mono · 16-bit PCM · tepe 0,950 · sessizlik %8,4 · kırpılma 0 |
| Konuşma hızı | 2,10 kelime/sn |
| Soğuk sentez | 82,6 sn (model indirme + yükleme dahil) |
| Sıcak sentez | 23,1 sn → 3,40 sn ses → **RTF 6,8×** (üç çalıştırmada 6,8–8,9×) |

**Sonuç:** CPU'da çalışıyor ama yavaş (30 sn anlatım ≈ 3,5–4,5 dk). Uzun videolar için eSpeak NG
yedeği varsayılan kalır; Chatterbox Ayarlar'dan seçilir ve motor adı projede saklanır.

## Bilinen sınırlar

- Telaffuz/doğallık otomatik ölçülemez; yayındaki `chatterbox-turkish-sample.wav` dinlenerek onaylanmalı.
- Chatterbox modeli (~2 GB) ilk çalıştırmada indirilir; kapalı ağda kullanılamaz.
- CPU'da RTF ≈ 8,9 → gerçek zamanlı değil.
- Ekran görüntüleri Chrome ile alınır; tarayıcı yoksa betik bunu raporlar (başarısızlık saymaz).
