# Nedenmiş Studio — Sürüm notları

## v1.1.0 — içerik kimliği, sade anlatım ve yeni arayüz

Bu sürüm **yeni bir uygulama değil**; video motoru, render hattı, görsel doğrulama, FFmpeg/FFprobe
doğrulaması, proje kalıcılığı, sahne düzenleme, altyazı, Windows kurulum dosyası ve v1.0.1 paketleme
düzeltmesi **aynen korunmuştur**. Değişen şey anlatım dili, görsel sadeleştirme ve arayüz.

### 1. Sade anlatım (varsayılan)

- Bilgi kartlarındaki her adım için **sade anlatım** (`narrationSimple`) yazıldı; bilimsel metin
  (`narration`) silinmedi, iç doğrulama ve "Ayrıntılı" düzey için saklanıyor.
- **Varsayılan dil düzeyi her zaman Sade.** Bilinmeyen değer de Sade'ye düşer.
- Sade düzeyde ekran başlıkları da jargonsuz: `KOVALENT BAĞLAR` → `ÇOK GÜÇLÜ BAĞLAR`,
  `OLAY UFU` (yazım hatası) → `GERİ DÖNÜŞ YOK`, `KRİSTALAR` → `KIVRIMLI ZAR`.
- Cümleler kısaldı: elmas videosunda ortalama **14,8 → 6,5 kelime**, teknik terim **3 → 0**.

### 2. Senaryo değerlendiricisi ve kalite kapısı

Yeni `packages/core/src/script/style.ts`:

- cümle uzunluğu, uzun cümle oranı, teknik terim yoğunluğu, kanca ölçümü → **0–100 puan**,
- sade düzeyde eşik aşılırsa senaryo otomatik yeniden sadeleştirilir (`ensureSimple`),
- sonuç projede `scriptQuality` olarak saklanır, Stüdyo'da panelde gösterilir.

### 3. Görsel anlatım

- Görsel karmaşıklık ayarı: **Sade (en fazla 2 etiket)** / Dengeli / Zengin.
- Sahne seçimi artık yapıyı koruyor: kanca ilk, **kapanış her zaman korunur**, ara adımlar sırayla
  eklenir — mekanizma zinciri ortadan bölünmez.
- Süre tahmini gerçekçi kelime hızına (2,6 kelime/sn) çekildi; 45 sn hedefinde elmas videosu 6
  sahnenin tamamını kullanıyor (önce 4 sahnede kalıyordu).
- Doğrulama zayıflamadı: kavram bağı sade metinde değil **bilimsel metinde** aranıyor
  (`scene.narrationScientific`), böylece dil sadeleşirken yanlış görsel riski artmıyor.

### 4. Chatterbox Multilingual (Türkçe)

- Köprü, `chatterbox-tts 0.1.7` **kaynağı okunarak** doğrulandı: `from_pretrained(device)`,
  `generate(text, language_id, audio_prompt_path=…)`, `sr=24000`, `"tr"` destekli.
- Sunucu artık **arka planda** model yükler; `/health` dört durumu bildirir:
  `ready` / `downloading` (indirilen MB ile) / `unavailable` / `fallback`.
- **Ses önizleme** (`POST /api/tts/preview`) gerçek WAV üretir — motor ancak dinlendikten sonra "hazır".
- Gerçek Türkçe sentez, CI'da isteğe bağlı adımda üretilip dalga biçimi incelenir; üretilemezse
  rapor bunu açıkça yazar (bkz. `docs/chatterbox-voice.md`, `reports/chatterbox-tr.json`).

### 5. Yeni arayüz (tek renk)

- Siyah/beyaz/gri tema, sistem tipografisi, ölçülü gölgeler, 140–200 ms geçişler.
- Menü dört girişe indi: **Projeler / Video oluştur / Stüdyo / Ayarlar**.
- Stüdyo'da önizleme önde; senaryo kalitesi paneli; sahne detayları katlanmış (progressive disclosure).
- Ayarlar ekranı dokuz ayarı ve motor durumlarını tek yerde toplar.
- Renkli ton kalmadığı **ölçülerek** doğrulanır (`npm run test:ui` → `monocheck`).

### 6. Testler

- Birim testleri: **34** (14'ü yeni: dil düzeyi, kanca, sadeleştirme, ekran başlıkları, süre yapısı,
  altyazı anahtarı, kalite paneli tutarlılığı).
- Uçtan uca: gerçek FFmpeg/FFprobe ile MP4 + doğrulama (CI'da gerçek eSpeak NG ile).
- Arayüz: jsdom duman testi (13 kontrol) + masaüstü çözünürlükte gerçek tarayıcı ekran görüntüleri.
- Windows: kurulum dosyası gerçekten kurulur, kurulu uygulama `--self-test` ile MP4 üretir.

### Korunanlar

Render hattı, 41 görsel bileşen, bilimsel doğrulama kapısı, ±%5 süre toleransı ve `DurationError`,
proje deposu (SQLite/JSON), sahne yeniden üretimi, .srt altyazı, gömülü Python + FFmpeg + eSpeak,
v1.0.1'deki `resources/node_modules` paketleme düzeltmesi.

## v1.0.1 — paketleme düzeltmesi (Windows kurulumu)

**v1.0.0 kurulum dosyası açılışta `Cannot find package '@resvg/resvg-js'` hatası veriyordu.**
Nedeni: electron-builder, uygulama klasöründeki **her** `node_modules` dizinini koşulsuz dışlıyor
(`app-builder-lib/out/fileMatcher.js` → `!**/node_modules`). Çalışma zamanı modülleri
`dist-app/node_modules` içine konduğu için kurulan uygulamaya hiç girmiyordu.

Düzeltme: çalışma zamanı modülleri `vendor/node_modules` altına hazırlanıp **`extraResources`** ile
`resources/node_modules` olarak paketlendi; `@resvg/resvg-js` ve platforma özgü native eklenti birlikte
taşınıyor; `scripts/build-desktop.mjs` zorunlu dosyaları denetliyor (eksikse kurulum üretilmiyor);
kurulu uygulama `--self-test` ile kendi kendini doğruluyor.

## v1.0.0 — ilk yayın

İlk çalışan sürüm. Kurulum dosyası **kullanılmamalıdır** (yukarıdaki paketleme hatası).
