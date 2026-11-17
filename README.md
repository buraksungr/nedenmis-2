# Nedenmiş Studio

**Bilimsel doğruluk odaklı, tamamen çevrimdışı çalışabilen Türkçe kısa bilim videosu stüdyosu.**
Bir soru yazarsınız; uygulama doğrulanmış bilgi kartıyla eşleştirir, Türkçe anlatım yazar, sahnelere böler,
her sahne için konuya özgü bir görsel seçer, görseli **denetler**, sesi üretir, süreyi **ölçülen** ses
sürelerine göre kurar ve 1080×1920 dikey MP4 üretip FFprobe ile doğrular.

> Anlatım kuralı: **karmaşık şeyleri, bilimsel olarak yanlış yapmadan, sade bir dille anlat.**
> Varsayılan dil düzeyi her zaman **Sade**; akademik metin iç doğrulama için saklanır, izleyiciye sade hâli gider.
>
> Temel kural: **yanlış görsel göstermektense sahneyi reddetmek yeğdir.** Bir sahnenin görseli konu ve
> mekanizmayla uyuşmuyorsa sahne `rejected` olur ve render kapısı kapanır.

---

## Öne çıkanlar

| | |
|---|---|
| **Konuya özgü görseller** | Görsel, konu adına göre değil **kavram + mekanizma** eşleşmesine göre seçilir. Elmas videosunda hücre/organel görseli üretmek yapısal olarak imkânsızdır. |
| **Açık reddetme** | 10 tip denetim (bileşen, alan, mekanizma, yasaklı kavram, yanılgı, yabancı alan etiketi…). Hata varsa sahne reddedilir, `assertApproved` render'ı durdurur. |
| **Dürüst zamanlama** | Anlatım süresi TTS'ten **ölçülür**; hedef süreye göre konuşma temposu ayarlanır, sessizce kırpma yapılmaz. %5 tolerans aşılırsa `DurationError`. |
| **Gerçek doğrulama** | Her çıktı FFprobe ile denetlenir: kare sayısı, süre, kodekler, 48 kHz AAC, ses-görüntü senkronu (<120 ms), sahne başına parlaklık/varyans, kare örnekleri. |
| **Sade Türkçe** | Her adımın sade anlatımı ayrı yazılır; kalite kapısı cümle uzunluğu, terim yoğunluğu ve kancayı ölçer, gerekirse yeniden sadeleştirir. |
| **Tek renk arayüz** | Siyah/beyaz/gri, ölçülü gölge ve geçişler; menü dört giriş. Renkli ton kalmadığı testle ölçülür. |
| **İsteğe bağlı nöral ses** | Chatterbox Multilingual (Türkçe) köprüsü durum bildirimli (`hazır`/`indiriliyor`/`kullanılamıyor`/`yedek`); ses önizlemesi gerçek WAV üretir. |
| **Çevrimdışı** | eSpeak NG yerel seslendirme + FFmpeg + SQLite; internet gerekmez. |
| **Masaüstü** | Electron kabuğu, NSIS kurulum dosyası, taşınabilir zip, kaynak zip; Node/Python/FFmpeg paket içinde. |

## Kurulum (Windows)

**İndirme:** [Son sürüm (Setup.exe, Portable.zip, Source.zip, SHA-256)](https://github.com/buraksungr/nedenmis-2/releases/latest)
— v1.1.0 sürümü: [github.com/buraksungr/nedenmis-2/releases/tag/v1.1.0](https://github.com/buraksungr/nedenmis-2/releases/tag/v1.1.0)
(v1.0.0 kurulum dosyasındaki `@resvg/resvg-js` paketleme hatası **v1.0.1**'de giderildi; v1.0.0'ı kullanmayın.)

1. `NedenmisStudio-Setup.exe` dosyasını çalıştırın (imzasız geliştirici uyarısı çıkarsa *Ek bilgi → Yine de çalıştır*).
2. Kurulum klasörünü seçin, kısayollar oluşturulur. Yönetici izni gerekmez (`asInvoker`).
3. İlk açılışta yerel servis 1–2 saniyede hazır olur; tarayıcı açılmaz, her şey uygulama penceresinde çalışır.

Taşınabilir sürüm: `NedenmisStudio-Portable.zip` arşivini boş bir klasöre açıp `Nedenmiş Studio.exe` dosyasını çalıştırın.

Ayrıntılar: [`docs/installation.md`](docs/installation.md).

**Sistem gereksinimi:** Windows 10/11 x64, 2 çekirdek CPU (hedef: i7-7660U), 4 GB RAM, 3 GB boş disk.
GPU gerekmez (tüm render CPU'da). 60 sn 1080p video, hedef donanımda yaklaşık 6–10 dakikada üretilir
(ölçüm: bu depodaki Linux konteynerinde 2 vCPU, ~5 kare/sn).

## Kullanım

1. **Video oluştur** → konuyu yazın (örn. “Elmas neden kolay kırılmaz?”), dil düzeyini (varsayılan Sade) ve süreyi seçin.
2. **Planla** → konu bilgi kartıyla eşleşir; sade senaryo, sahne planı, senaryo kalite ölçümü ve görsel doğrulama raporu üretilir.
3. **Stüdyo** ekranında:
   - Sahne kartlarında gerçek render motorundan alınan **önizleme kareleri**, kullanılan bileşen, mekanizma ve doğrulama durumu görünür.
   - Anlatımı düzenleyebilir, görsel bileşeni değiştirip **sahneyi yeniden üretebilirsiniz**.
   - **Seslendir** → gerçek TTS; süreler ölçülür ve zaman çizelgesi kurulur.
   - **Videoyu üret** → kareler üretilir, sesle birleştirilir, FFprobe doğrulaması yapılır.
   - Sağ üstteki **Senaryo kalitesi** paneli: puan, ortalama cümle uzunluğu, en uzun cümle, terim sayısı, kanca.
5. Ayarlar ekranında varsayılanlar (dil, süre, görsel karmaşıklık, altyazı, kalite, motor, hız) ve motor durumları.
4. Çıktılar: `…/out/<id>-<kart>-<süre>s.mp4`, `.srt`, `reports/verification.json`, `reports/visual-validation.json`, `reports/frames/*.jpg`, `reports/poster.png`.

## Sade anlatım örneği

| Önce (v1.0.1, akademik) | Sonra (v1.1.0, sade) |
|---|---|
| “Elmasın üç boyutlu tetrahedral kristal kafes yapısı, karbon atomları arasındaki güçlü kovalent bağlarla meydana gelir.” | “Elmasın içindeki karbon atomları birbirine çok sıkı tutunur. Her atom, dört komşusuna birden bağlıdır.” |
| “Bu bağ ağı, ona çok yüksek sertlik kazandırır; ancak sertlik ile tokluk farklı özelliklerdir ve elmas gevrektir.” | “Ama sert olmak, kırılmaz olmak demek değil. Elmas serttir; yine de darbeyle çatlayabilir.” |

Tam karşılaştırma (4 konu, ölçümlerle): [`docs/before-after-script.md`](docs/before-after-script.md).
İçerik ilkeleri: [`docs/content-identity.md`](docs/content-identity.md) ·
Arayüz: [`docs/ui-redesign.md`](docs/ui-redesign.md) ·
Chatterbox: [`docs/chatterbox-voice.md`](docs/chatterbox-voice.md).

## Bilimsel doğrulama

```
konu → eşleşme (kart yoksa üretim yok)
     → senaryo (Türkçe, hedef süreye göre)
     → sahne planı (kavram + mekanizma → görsel bileşen)
     → 10 denetim/sahne → approved | rejected
     → rejected varsa render kapısı kapalı (VisualValidationError)
```

* Görseller **bileşen kataloğundan** seçilir; her bileşen hangi kavramları doğru gösterebildiğini ve hangileriyle
  asla kullanılmaması gerektiğini (`incompatibleConcepts`) bildirir.
* Sahne, kartın `domains` alanıyla ve adımın `mechanism` alanıyla uyuşmak zorundadır.
* Yanılgı (misconception) metinleri anlatımda yasaklıdır.
* Ayrıntılı yöntem ve ölçümler: [`docs/scientific-validation.md`](docs/scientific-validation.md).

## Desteklenen konular (v1.0)

Doğrulanmış bilgi kartı bulunan 11 konu ailesi: elmas sertliği/kırılganlığı, gökyüzünün maviliği,
denizlerin tuzluluğu, kara delikler, metallerin iletkenliği, mitokondri ve ATP, fotosentez,
yerçekimi, depremler, okyanus akıntıları, hafıza.

Listede olmayan bir konu yazıldığında uygulama **video üretmez**; en yakın kartları ve nedenini gösterir.
Bu bilinçli bir sınırdır: uydurma görsel/anlatım yerine açık ret.

## Seslendirme motorları

| Motor | Durum | Not |
|---|---|---|
| **eSpeak NG** (varsayılan) | ✅ Bu depoda üretilen tüm örneklerde kullanıldı | Tamamen çevrimdışı, Türkçe, robotik; arayüzde böyle etiketlenir. |
| **Windows SAPI** | ✅ Windows'ta kullanılabilir (yerel test edilemedi: bu ortam Linux) | `System.Speech` köprüsü (`scripts/sapi_tts.ps1`); Türkçe ses (Microsoft Tolga) kuruluysa onu kullanır. Python gerekmez. |
| **Chatterbox Multilingual** | ⚠️ Adaptör hazır, **bu ortamda doğrulanamadı** | Yerel HTTP köprüsü (`packages/core/scripts/chatterbox_server.py`), `/health` + `/synthesize`. Model ağırlıkları depoya dahil değildir; Hugging Face erişimi bu derleme ortamında engellendiği için gerçek çıktı üretilemedi. Uygulama sessizce başka motora geçmez; hata verir. |
| **Piper** | ⚠️ Adaptör hazır, ses modeli yok | Türkçe `.onnx` modeli tanımlanırsa çalışır. |
| sessiz | Test | Süreleri tahmin eder ve **uyarı** üretir. |

Chatterbox kurulumu (internet erişimi olan makinede):

```powershell
python -m pip install chatterbox-tts
python packages\core\scripts\chatterbox_server.py --port 4321
# Uygulamada: Yeni video → Seslendirme → Motor: Chatterbox → adres http://127.0.0.1:4321
```

## Komut satırı

```bash
npm run studio                 # geliştirme: API + arayüz
npm run build                  # core + server + ui
npm test                       # 19 birim testi
npm run test:e2e               # gerçek TTS + FFmpeg ile video üretimi
npm run render:samples         # 6 yayın örneği (60 sn, 1080p)
npm run verify:samples         # örnekleri FFprobe ile yeniden doğrular
npm run build:desktop          # Windows kurulum dosyası (Windows/CI)
npm run build:source-zip       # NedenmisStudio-Source.zip
npm run checksums              # SHA-256 listesi
```

## Mimari

```
packages/core      ontology (bilgi kartları) · visual (bileşenler, planlayıcı, doğrulayıcı)
                   render (SVG → PNG → FFmpeg, FFprobe) · audio (TTS) · project (hat) · storage (SQLite)
packages/server    Node HTTP API + SSE iş akışı + statik arayüz
packages/ui        React 19 + Vite arayüz (koyu tema)
packages/desktop   Electron ana süreç + electron-builder yapılandırması
scripts            örnek üretimi, galeri, simge, paketleme, kaynak zip
tests              birim + uçtan uca testler
```

Veri modeli: `Project → scenes[] → spec{componentId, mechanism, params}` + `validation`, `narration.measured`,
`timelineMeta`, `verification`. Projeler SQLite (`node:sqlite`) içinde JSON belge olarak saklanır; modül yoksa
JSON dosyasına düşer ve arayüz bunu bildirir.

## Örnekler ve ölçümler

`samples/` altında altı zorunlu konunun gerçek çıktıları (MP4, SRT, poster, `verification.json`,
`visual-validation.json`, senaryo) ve `samples/manifest.json` içinde SHA-256 + FFprobe ölçümleri bulunur.
Bu dosyalar **gerçek** üretimlerdir; hiçbiri yer tutucu değildir. Ayrıntı: [`docs/scientific-validation.md`](docs/scientific-validation.md).

## Dürüst sınırlar

* Bilgi tabanı 11 konu kartıdır; genel amaçlı boru hattı hazırdır ama yeni konu için **kaynaklı kart** eklenmelidir.
* Bu depodaki tüm örnek videolar eSpeak NG ile seslendirilmiştir; Chatterbox sesi bu ortamda üretilemedi.
* Kurulum dosyası ve taşınabilir zip, GitHub Actions Windows çalıştırmasında üretilir; bu Linux konteynerinde
  Electron ikilisi indirilemediği için yerel olarak yalnızca `dist-app/` hazırlanabilir.
* Ölçülen süreler hedefe ±%5 içinde tutulur; tutmazsa hata verilir — “yaklaşık” bir video sessizce yayınlanmaz.

## Lisans

MIT — üçüncü taraf bileşenler için [`LICENSE`](LICENSE) dosyasına bakın.
