# Chatterbox Multilingual (Türkçe) — kurulum, durum ve dürüst sınırlar

Bu sürümde Chatterbox, **isteğe bağlı birincil** seslendirme motorudur. Kurulabilir ve
Türkçe sentezleyebilir; ancak kurulum ağır olduğu için uygulama onu zorla kullanmaz.
Kurulamazsa eSpeak NG yedeği **açıkça etiketlenerek** kullanılır — sessiz otomatik geçiş yoktur.

## API doğrulaması (varsayım değil, kaynak)

Köprü `chatterbox-tts 0.1.7` sürümünün **kaynağı okunarak** yazıldı
(`src/chatterbox/mtl_tts.py`):

| Doğrulanan | Değer |
| --- | --- |
| Sınıf | `from chatterbox.mtl_tts import ChatterboxMultilingualTTS` |
| Yükleme | `ChatterboxMultilingualTTS.from_pretrained(device)` — `device` **zorunlu**, `"cpu"` kabul edilir |
| Sentez | `model.generate(text, language_id, audio_prompt_path=None, exaggeration=0.5, cfg_weight=0.5, temperature=0.8, repetition_penalty=2.0, min_p=0.05, top_p=1.0)` |
| Örnekleme | `model.sr == 24000` (`S3GEN_SR`) |
| Türkçe | `SUPPORTED_LANGUAGES` içinde `"tr": "Turkish"` **var** |
| Dönüş | `[1, N]` tensör (24 kHz, filigranlı) |
| Ağırlıklar | HuggingFace: `ResembleAI/chatterbox` (`snapshot_download`; `HF_TOKEN` isteğe bağlı) |
| Python | `requires-python = ">=3.10"` |
| Bağımlılıklar | `torch==2.6.0`, `torchaudio==2.6.0`, `transformers==5.2.0`, `diffusers==0.29.0`, `librosa==0.11.0`, `s3tokenizer`, `conformer==0.3.2`, `resemble-perth` |

Köprü, imzaları çalışma zamanında `inspect.signature` ile doğrular; imza beklenenden farklıysa
sessizce yanlış çalışmak yerine hata verir (`language_id` yoksa `RuntimeError`).

## Durumlar birbirinden ayrıdır

Arayüz ve `/api/health` dört durumu ayırt eder (`TtsStatus.state`):

| Durum | Anlamı | Arayüzde |
| --- | --- | --- |
| `ready` | Model yüklendi, sentez yapılabilir | `hazır` (dolu rozet) |
| `downloading` | İlk çalıştırma: ağırlıklar indiriliyor (MB bilgisiyle) | `model indiriliyor` |
| `unavailable` | Paket yok / sunucu kapalı / model yüklenemedi | `kullanılamıyor` |
| `fallback` | Chatterbox yok, yedek motor seçili | `yedek etkin` |

Sunucu köprüsü (`packages/core/scripts/chatterbox_server.py`) modeli **arka planda** yükler,
böylece `/health` indirme sırasında bile yanıt verir:

```
GET  /health      → {"ok":false,"state":"downloading","cacheMb":812,...}
GET  /languages   → paketten okunan dil listesi ("tr" dahil)
POST /synthesize  → {"text":"...","language_id":"tr","voice_ref":null} → 24 kHz WAV
```

## Kurulum

```bash
python -m venv .venv-cb
# Windows: .venv-cb\Scripts\activate    Linux/macOS: source .venv-cb/bin/activate
pip install chatterbox-tts          # torch + model bağımlılıklarıyla birlikte ~2 GB
python packages/core/scripts/chatterbox_server.py --status     # kurulum + imza raporu
python packages/core/scripts/chatterbox_server.py --port 8123  # sunucuyu başlat
```

Studio'da: **Ayarlar → Seslendirme → Motor: Chatterbox**, sunucu adresi `http://127.0.0.1:8123`.
**"Örneği dinle"** düğmesi gerçek bir WAV üretir (`POST /api/tts/preview`) — motor ancak bu ses
duyulduktan sonra "hazır" kabul edilir.

## İlk çalıştırma indirmesi

Model ağırlıkları uygulamayla **gelmez**. İlk sentezde HuggingFace'ten indirilir (~2 GB) ve
`cacheMb` alanı arayüzde ilerleme olarak görünür. Kapalı/firewall'lu ağlarda bu adım başarısız olur;
o durumda durum `unavailable` olur ve neden(ler)i `detail` alanında yazar.

## Dürüst sınırlar

- **CPU'da yavaş**: gerçek zamanın birkaç katı. GPU (`CHATTERBOX_DEVICE=cuda`) varsa hızlanır.
- **Paketlenmiş kuruluma dahil değil**: torch + model ağırlıkları kurulum dosyasına konmaz,
  çünkü kurulum 136 MB'tan ~2,5 GB'a çıkardı. Kullanıcı isterse kendi Python ortamına kurar.
- **Ağ gerekir**: ilk çalıştırma huggingface.co'ya erişim ister.
- Varsayılan motor **eSpeak NG**'dir (tamamen çevrimdışı, robotik). Chatterbox hazır olduğunda
  Ayarlar'dan seçilir; seçim proje bazında saklanır.

## Bilinen tuzak: `setuptools` / `pkg_resources`

Windows CI'da gerçek sentez denemesinde şu hata alındı:

```
'NoneType' object is not callable
```

Kök neden (paket kaynağından doğrulandı): `resemble-perth` içindeki
`perth/perth_net/__init__.py` → `from pkg_resources import resource_filename`.
**setuptools 81 sürümünde `pkg_resources` kaldırıldı.** Bu import başarısız olunca
`perth/__init__.py` hatayı yutar ve `PerthImplicitWatermarker = None` yapar.
Aynı hata iki farklı kurulumda görülür:

- setuptools hiç kurulu değil (temiz Python 3.12 venv'i),
- setuptools **çok yeni** (81+): modül var ama `pkg_resources` yok.

Yani "setuptools kur" tek başına yetmez; sürüm **`setuptools<81`** olarak sabitlenmelidir. Chatterbox modeli kurulurken
`self.watermarker = perth.PerthImplicitWatermarker()` çağrısı bu yüzden `None`'ı çağırmaya çalışır.

Çözüm: `pip install "setuptools<81"`. Bu sürümde:

- CI adımı `pip install chatterbox-tts "setuptools<81"` yapar ve `perth` importunu doğrular,
- `chatterbox_server.py` model yüklenirken filigran modülünü denetler ve anlaşılır hata verir
  (`ensure_watermarker`), `/health` ve `--status` çıktısında `watermarker.available` alanı bulunur,
- `scripts/chatterbox-verify.py` hatayı tam iz (traceback) ve çözüm ipucuyla raporlar.

## CI'da ne oldu (kanıtlı)

| Çalıştırma | Sonuç | Kanıt |
| --- | --- | --- |
| v1.1.0 ilk denemeler | kurulum tamam, model yüklemede `'NoneType' object is not callable` | `chatterbox-tr.json` (eski) |
| `setuptools<81` eklendikten sonra | `perth` yüklendi: `watermarker: <class 'perth...PerthImplicitWatermarker'>` | `chatterbox-import-check.log` |
| 43980556980 | **model indirildi ve Türkçe sentez çalıştı** (`Fetching 6 files`, WAV üretildi) | `chatterbox-turkish-sample.wav` (441 680 bayt) |
| aynı çalıştırma, analiz adımı | `wave.Error: unknown format: 3` — çıktı IEEE float32 | `chatterbox-verify.log` |

Yani sorun model ya da CPU değildi: **çıktı biçimi** analiz aracını kırdı ve bu hata
`UnicodeEncodeError` ile (Windows cp1252 konsolu) ikinci kez maskelendi. Düzeltmeler:

1. Köprü artık WAV'ı **16-bit PCM** yazıyor (`encoding="PCM_S", bits_per_sample=16`;
   soundfile yedeğinde `subtype="PCM_16"`).
2. `chatterbox-verify.py` RIFF başlığını kendisi ayrıştırır: PCM16/24/32 ve **float32** okunur.
3. Tüm Python çıktısı UTF-8'e sabitlendi (`reconfigure`, CI'da `PYTHONIOENCODING=utf-8`).
4. Analiz çökse bile rapor yazılır; süreç asla sessizce "çalıştı" demez.

## Doğrulama durumu (bu sürüm)

Kod, API ve durum makinesi doğrulandı. **Gerçek Türkçe sentez** için:

- Geliştirme sandbox'ında (bu ortam) `torch` yok ve HuggingFace erişimi kapalı → sentez **yapılmadı**.
  `python scripts/chatterbox-verify.py` burada `outcome: "not-installed"` yazar; bu rapor depoda
  `reports/chatterbox-tr.json` olarak durur.
- Windows CI iş akışında (`Chatterbox Türkçe sentez testi` adımı) venv kurulup model gerçekten
  indirilir, Türkçe cümle sentezlenir, WAV dalga biçimi (tepe/RMS/sessizlik oranı) incelenir ve
  `reports/chatterbox-turkish-sample.wav` + `reports/chatterbox-tr.json` yayına eklenir.
- Bu adım **isteğe bağlıdır** (`continue-on-error`), çünkü 2 GB indirme her zaman mümkün olmayabilir.
  Başarısız olursa yayın yine üretilir, ama rapor bunu **açıkça** yazar; "çalışıyor" iddiası yapılmaz.

Yani: Chatterbox'ın Türkçe desteği paket kaynağıyla doğrulanmıştır; sentezin gerçekten çalıştığı
ancak üretilen WAV incelendiğinde iddia edilir.
