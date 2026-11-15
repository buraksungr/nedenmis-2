# Mimari

## Katmanlar

```
┌──────────────────────────── Electron (packages/desktop) ────────────────────────────┐
│  main.cjs: yerel sunucuyu başlatır (127.0.0.1, rastgele port), pencereyi açar         │
└───────────────────────────────────┬─────────────────────────────────────────────────┘
                                    │ HTTP + SSE
┌───────────────────────────────────▼─────────────────────────────────────────────────┐
│  Server (packages/server)  /api/plan · /api/projects · /api/jobs/:id/events · files │
│                            JobManager: tek kuyruk (2 çekirdek hedefi)               │
└───────────────────────────────────┬─────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────────────┐
│  Core (packages/core)                                                               │
│  ontology/  bilgi kartları, kavram sözlüğü, konu çözümleme                          │
│  visual/    primitives · planner · validate · components (41)                       │
│  render/    timeline · svg · raster (resvg) · encode (ffmpeg) · verify (ffprobe)    │
│  audio/     tts (chatterbox | piper | espeak | silent) · ölçüm                      │
│  project/   createProject → narrateProject → renderProject                          │
│  storage/   SQLite (node:sqlite) ya da JSON                                         │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Akış

1. **resolveTopic** — konu metni, kart başlıkları/kavramları/anahtar kelimeleriyle skorlanır.
   Kart yoksa `TOPIC_UNSUPPORTED` → UI'da açık ret mesajı ve en yakın kartlar.
2. **buildResearchSummary** — özet, kanıtlar, kaynaklar, yanılgılar (karttan).
3. **selectSteps** — hedef süre bütçesine göre adım seçimi; giriş ve kapanış korunur.
4. **buildScene / selectComponent** — kavram kapsamı + mekanizma + alan uyumu puanı;
   `incompatibleConcepts` eşleşmesi puanı düşürür.
5. **validatePlan** — 10 denetim; hata varsa `rejected`.
6. **narrateProject** — her sahne TTS ile üretilir, süre ölçülür. Toplam süre hedefin
   %90'ının altındaysa tempo düşürülerek **ikinci geçiş** yapılır (sahne germek yerine).
7. **buildTimeline** — `frames = round(süre × fps)`; %5 tolerans aşılırsa `DurationError`.
8. **renderProject** — `renderFrameSvg(timeline, t)` saf fonksiyon → resvg → PNG → ffmpeg stdin.
   Ses: sahne başına `adelay + apad + -t` ile tam süreye hizalanır, `concat` ile birleştirilir.
9. **verifyVideo** — FFprobe: kare sayısı, süre, kodek, örnekleme, A/V senkron; sahne kareleri
   çıkarılıp parlaklık/varyans ölçülür.

## Neden bu mimari?

| Karar | Gerekçe |
|---|---|
| Görseller kod içinde, deklaratif bileşenler | “Konu adı → görsel” eşlemesi yanlış çıktı üretiyordu; kavram+mekanizma eşlemesi denetlenebilir. |
| `validateScene` saf ve zorunlu | Render kapısı doğrulamaya bağlı: `assertApproved` başarısızsa kare üretilmez. |
| SVG → PNG → ffmpeg boru hattı | Tarayıcı/Puppeteer yok; 2 çekirdekte deterministik ve düşük bellek. |
| Ölçülen ses süresi | Tahmini sürelerle kurgulanan videolar kayıyordu; altyazı ve sahne sınırları ölçüme bağlandı. |
| Yerleşik `node:sqlite` | Windows kurulumunda ek derleme/VC++ gerektirmez; yoksa JSON'a düşer. |
| Tek iş kuyruğu | Render CPU'ya doymuş durumda; paralel iş toplam süreyi uzatıyordu. |

## Proje veri modeli

```ts
Project {
  id, topic, title, status,
  research: { summaryTr, facts[], sources[], misconceptions[] },
  script: { text, wordCount, estimatedSec },
  scenes: Scene[] {
    id, index, stepId, narration, overlay,
    spec: { componentId, mechanism, params, concepts, labels, rationale, scientificNote },
    validation: { status, score, checks[] },
    durationSec?, speechDurationSec?
  },
  narration: { engine, voice, rate, measured{}, audioFiles{} },
  timelineMeta: { durationSec, frames, subtitleTiming },
  verification: { checks[], frameSamples[] },
  outputs: { videoPath, srtPath, verificationPath, validationPath }
}
```

## Dosya düzeni (çalışma zamanı)

```
%APPDATA%\Nedenmiş Studio\
  logs\studio.log
  data\
    db\nedenmis.db          # SQLite
    projects\<id>\
      project.json
      audio\*.wav
      render\narration.wav
      out\*.mp4, *.srt
      reports\verification.json, visual-validation.json, poster.png, frames\*.jpg
```
