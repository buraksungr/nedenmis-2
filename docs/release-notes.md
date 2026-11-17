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

### 8. Chatterbox Multilingual Türkçe seslendirme (isteğe bağlı motor)

- Köprü (`packages/core/scripts/chatterbox_server.py`) gerçek `chatterbox-tts 0.1.7` API'siyle çalışır;
  Türkçe (`tr`) desteklenir. Kurulum: `pip install chatterbox-tts "setuptools<81"`.
  (`setuptools` 81+ `pkg_resources`'ı kaldırdığı için filigran modülü sessizce `None` oluyordu;
  hata `'NoneType' object is not callable` olarak görünüyordu — düzeltildi ve belgelendi.)
- **Gerçek Türkçe sentez üretildi ve ölçüldü** (CI, CPU): 5,60 sn, 24 kHz mono, 16-bit PCM,
  sessizlik %4,6, kırpılma yok, 1,61 kelime/sn. Dosyalar: `chatterbox-turkish-sample.wav`,
  `chatterbox-turkish-warm.wav`, `chatterbox-tr.json`.
- **CPU'da hız:** sıcak sentez RTF ≈ **8,9×** (30 sn anlatım ≈ 4,5 dk). Yani çalışıyor ama yavaş;
  uzun videolarda eSpeak NG yedeği varsayılandır ve arayüzde “robotik yedek” olarak etiketlenir.
- Motor seçimi açıktır, projede saklanır (`narration.engineUsed`); **sessiz geçiş yapılmaz**.

### 9. Arayüz: video önizlemesi merkezde

- Stüdyo yeniden düzenlendi: büyük 9:16 önizleme sahnenin ortasında; sağda ilerleme, senaryo
  kalitesi ve ses özeti; altta zaman çizelgesi ve sahne kartları; doğrulama/araştırma/zamanlama
  “Teknik ayrıntılar” katlanır panelinde.
- Tek renk kuralı artık iki katmanlı doğrulanıyor: kaynak paleti taraması (`npm run check:colors`)
  ve ekran görüntüsünde **arayüz kromu** ölçümü (sahne önizlemeleri *içerik* olduğu için hariç).

### 10. Sürüm doğrulaması

GitHub Actions **43994410308** (commit `37e2525`): **28/28 adım başarılı**. Kurulum dosyası sessiz
kuruldu, kurulu uygulama `--self-test` ile resvg/FFmpeg/gömülü Python/gerçek MP4/FFprobe denetimlerini
geçti. Örnek videolar 4 zorunlu konuda 30 sn / 1080×1920 / H.264 + AAC 48 kHz olarak yeniden üretildi
ve FFprobe ile doğrulandı (6/6).

> Not: NSIS sessiz kurulumu paylaşılan runner'da ara sıra erişim ihlaliyle (0xC0000005) düşebiliyor.
> İş akışı artık 3 deneme yapar, tanı dosyası (`install-diag.json`) bırakır ve gerekirse paketlenmiş
> taşınabilir sürümle kurulu-uygulama testini sürdürür; hangi modun kullanıldığı raporda yazar.
