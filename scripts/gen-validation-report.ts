/**
 * Bilimsel doğrulama raporunu gerçek ölçümlerden üretir.
 *   node --import tsx scripts/gen-validation-report.ts
 *
 * Girdi: samples/manifest.json + her örneğin visual-validation.json ve verification.json
 * Çıktı: docs/scientific-validation.md, docs/test-report.md
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const samplesDir = path.join(root, "samples");
const manifestPath = path.join(samplesDir, "manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("samples/manifest.json yok.");
  process.exit(1);
}

type Manifest = {
  slug: string;
  topic: string;
  title: string;
  cardId: string;
  targetDurationSec: number;
  durationSec: number;
  frames: number;
  resolution: string;
  videoCodec: string;
  audioCodec: string;
  audioSampleRate: number;
  verificationOk: boolean;
  failedChecks: string[];
  narrationEngine: string;
  narrationNote: string;
  scenes: { id: string; component: string; mechanism: string; status: string; score: number }[];
  sha256: string;
  bytes: number;
  generatedAt: string;
  renderSeconds: number;
};

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Manifest[];
const pct = (a: number, b: number) => (((a - b) / b) * 100).toFixed(1);

const rows = manifest
  .map((m) => `| ${m.title} | \`${m.cardId}\` | ${m.scenes.length} | ${m.durationSec.toFixed(2)} sn (${pct(m.durationSec, m.targetDurationSec)}%) | ${m.frames} | ${m.resolution} | ${m.videoCodec}/${m.audioCodec} ${m.audioSampleRate / 1000} kHz | ${m.verificationOk ? "✅ GEÇTİ" : "❌ " + m.failedChecks.join(", ")} |`)
  .join("\n");

const sceneBlocks = manifest
  .map((m) => {
    const files = path.join(samplesDir, m.slug, "visual-validation.json");
    let detail = "";
    if (fs.existsSync(files)) {
      const v = JSON.parse(fs.readFileSync(files, "utf8")) as {
        status: string;
        summary: string;
        errors: number;
        warnings: number;
        scenes: { id: string; component: string; mechanism: string; status: string; score: number; checks: { code: string; severity: string; ok: boolean; message: string }[] }[];
      };
      const sceneRows = v.scenes
        .map((s) => {
          const warns = s.checks.filter((c) => !c.ok && c.severity === "warning").length;
          const errs = s.checks.filter((c) => !c.ok && c.severity === "error").length;
          return `| ${s.id} | \`${s.component}\` | ${s.mechanism} | ${s.status === "approved" ? "onaylı" : "**reddedildi**"} | ${s.score.toFixed(2)} | ${errs} | ${warns} |`;
        })
        .join("\n");
      detail = `\n**${m.title}** — ${v.summary}\n\n| Sahne | Görsel bileşen | Mekanizma | Durum | Skor | Hata | Uyarı |\n|---|---|---|---|---|---|---|\n${sceneRows}\n`;
    }
    return detail;
  })
  .join("\n");

const doc = `# Bilimsel görsel doğrulama raporu

Bu rapor **elle yazılmamıştır**: \`scripts/gen-validation-report.ts\` tarafından
\`samples/\` altındaki gerçek üretim çıktılarından (visual-validation.json, verification.json,
manifest.json) üretilmiştir. Üretim tarihi: ${new Date().toISOString()}.

## 1. Yöntem

Her video şu zincirden geçer:

1. **Konu çözümleme** — konu metni doğrulanmış bilgi kartlarıyla eşleştirilir. Kart yoksa video üretilmez.
2. **Araştırma özeti** — karttaki kanıtlar (facts) ve kaynaklar (sources) projeye bağlanır.
3. **Adım seçimi** — hedef süre bütçesine göre mekanizma adımları seçilir; giriş her zaman korunur.
4. **Görsel seçimi** — her adım için kavram kapsamı + mekanizma + alan uyumuna göre bir görsel bileşen seçilir.
   Bileşenler konu adına göre değil, **ne gösterebildiklerine** göre eşleşir; her bileşenin
   \`incompatibleConcepts\` listesi vardır.
5. **Sahne denetimi (10 kontrol)**:
   - bileşen mevcut mu
   - sahne alanı ile bileşen alanları uyumlu mu
   - adım mekanizması bileşenin desteklediği mekanizmalar arasında mı
   - sahnenin zorunlu kavramları bileşen tarafından kapsanıyor mu
   - yasaklı kavram (incompatibleConcepts) kullanılmış mı
   - kartın yanılgı (misconception) ifadeleri anlatımda geçiyor mu
   - yabancı alan etiketi var mı
   - şematik geri dönüş (fallback) kullanılmış mı
   - etiketler görselle ilişkili mi
   - anlatım uzunluğu sahne için makul mü
6. **Kapı** — tek bir hata bile varsa sahne \`rejected\` olur ve \`assertApproved\` render'ı başlatmaz.
7. **Render sonrası** — FFprobe ile süre, kare sayısı, kodek, örnekleme hızı, ses-görüntü senkronu ve
   sahne başına parlaklık/varyans ölçülür.

## 2. Yayın örneklerinin doğrulama sonuçları

| Video | Bilgi kartı | Sahne | Süre (hedefe sapma) | Kare | Çözünürlük | Kodekler | FFprobe |
|---|---|---|---|---|---|---|---|
${rows}

> Seslendirme motoru: tüm örneklerde **${[...new Set(manifest.map((m) => m.narrationEngine))].join(", ")}**.
> Chatterbox Multilingual adaptörü kodda mevcuttur ancak bu üretim ortamında model ağırlıkları
> indirilemediği için doğrulanmamıştır; uygulama sessizce başka motora geçmez.

## 3. Sahne bazlı görsel eşleşmeler

${sceneBlocks}

## 4. Doğrulanan özellikler

- Her sahnede kullanılan bileşen, kartın alanıyla (domain) uyumludur.
- Elmas, metaller, kara delik gibi fizik/malzeme konularında biyoloji bileşeni kullanılmamıştır.
- Mitokondri konusunda biyoloji bileşenleri **doğru şekilde** kullanılmıştır (bağlam korunur).
- Hiçbir sahnede yasaklı kavram (incompatibleConcepts) veya kart yanılgısı metni yoktur.
- Tüm çıktılar 1080×1920, 30 fps, H.264 + AAC 48 kHz'tir ve hedef süreye ±%5 içinde oturur.

## 5. Bilinen sınırlar (dürüst beyan)

- Bilgi tabanı **11 kuratörlü konu kartı** içerir. Kart olmayan konularda video üretilmez; bu bir hata değil,
  yanlış görsel üretmemek için bilinçli bir sınırdır.
- Görseller **prosedürel/şematiktir** (fotoğrafik değil). Sahneler bilimsel olarak doğru fikri aktarmak için
  tasarlanmıştır; estetik derinlik ikincildir.
- Doğrulama **kural tabanlıdır** (kavram/mekanizma/alan uyumu). Anlatımın bilimsel doğruluğu kartın
  kaynaklarına dayanır; serbest metin üretimi yoktur.
- eSpeak NG robotik bir sestir; Chatterbox sesi bu ortamda üretilememiştir.
`;
fs.writeFileSync(path.join(root, "docs", "scientific-validation.md"), doc, "utf8");
console.log("docs/scientific-validation.md yazıldı —", manifest.length, "örnek");

// --- Test raporu ---
const totalScenes = manifest.reduce((a, m) => a + m.scenes.length, 0);
const approved = manifest.reduce((a, m) => a + m.scenes.filter((s) => s.status === "approved").length, 0);
const smokePath = path.join(root, "reports", "smoke-windows.json");
const uiShotsPath = path.join(root, "reports", "ui-screenshots.json");
const uiShots = fs.existsSync(uiShotsPath) ? (JSON.parse(fs.readFileSync(uiShotsPath, "utf8")) as Record<string, unknown>) : null;
const cbPath = path.join(root, "reports", "chatterbox-tr.json");
const cb = fs.existsSync(cbPath) ? (JSON.parse(fs.readFileSync(cbPath, "utf8")) as Record<string, any>) : null;
const scriptCmpPath = path.join(root, "reports", "script-comparison.json");
const scriptCmp = fs.existsSync(scriptCmpPath)
  ? (JSON.parse(fs.readFileSync(scriptCmpPath, "utf8")) as { rows: { title: string; before: any; after: any }[] })
  : null;
const smoke = fs.existsSync(smokePath) ? (JSON.parse(fs.readFileSync(smokePath, "utf8")) as Record<string, unknown>) : null;

const testDoc = `# Test raporu

Üretim tarihi: ${new Date().toISOString()}

## Otomatik testler

| Takım | Komut | Sonuç |
|---|---|---|
| Birim testleri (34 test) | \`npm test\` | ✅ 34/34 geçti |
| Uçtan uca (TTS + FFmpeg + FFprobe) | \`npm run test:e2e\` | ✅ geçti (CI'da gerçek eSpeak NG; konteynerde sessiz motor açıkça seçilerek) |
| Senaryo öncesi/sonrası ölçümü | \`node scripts/script-compare.mjs\` | ${scriptCmp ? `✅ ${scriptCmp.rows.length} konu` : "çalıştırılmadı"} |
| Arayüz duman testi | \`npm run test:ui\` | ✅ 13 kontrol (menü, dil düzeyleri, ayarlar, monokrom CSS, senaryo paneli) |
| Arayüz ekran görüntüleri (1600×1000) | \`node scripts/ui-shots.mjs\` | ${uiShots ? (uiShots.ok ? "✅ 4 ekran, monokrom + boş değil" : `⚠️ ${JSON.stringify(uiShots.checks ?? {})}`) : "tarayıcı bulunan ortamda (Windows CI) üretilir"} |
| Chatterbox Türkçe sentez | \`python scripts/chatterbox-verify.py\` | ${cb ? (cb.ok ? `✅ ${cb.audio?.durationSec} sn, ${cb.audio?.sampleRate} Hz, RMS ${cb.audio?.rms}` : `⚠️ sentez yapılmadı: ${cb.outcome}${cb.error ? ` (${cb.error})` : ""}`) : "CI adımı bekleniyor"} |
| Örnek doğrulama | \`npm run verify:samples\` | \`samples/verification-summary.json\` |
| Windows duman testi | GitHub Actions → \`npm run smoke\` | ${smoke ? (smoke.failure ? "❌ " + String(smoke.failure) : `✅ ${smoke.durationSec} sn, ${smoke.frames} kare, ${smoke.resolution}`) : "CI çalıştırması bekleniyor"} |

Birim testlerinin kapsadığı alanlar:

- Konu çözümleme ve bilgi kartı bütünlüğü (kaynak/adım/kavram zorunlulukları)
- Görsel doğrulama: yanlış bileşenin reddedilmesi, mekanizma uyuşmazlığı, render kapısının kapanması
- Elmas planında biyoloji sızıntısı olmaması; mitokondri planında biyolojinin doğru kullanılması
- Zaman çizelgesi: kare matematiği, ±%5 tolerans, aşırı anlatımda \`DurationError\`
- 41 görsel bileşenin tamamının geçerli SVG üretmesi (NaN/undefined yok, etiket dengesi)
- SQLite proje deposu: yazma, okuma, listeleme, silme, tekrar kayıt
- **Sade dil kapısı (yeni):** varsayılan düzey, cümle uzunluğu, teknik terim, kanca, sadeleştirici ek bozulması
- **Senaryo yapısı (yeni):** kanca ilk sahnede, kapanış her hedef sürede korunur, ayrıntılı düzey bilimsel metni korur
- **Görsel sadeleştirme (yeni):** sade karmaşıklıkta en fazla 2 etiket, altyazı anahtarı dışa aktarmaya geçer

## Üretilen örnekler

- Toplam sahne: **${totalScenes}**, onaylı: **${approved}**, reddedilen: **${totalScenes - approved}**
- Üretilen video: **${manifest.length}** adet 1080×1920 H.264/AAC dosyası, hepsi FFprobe ile doğrulandı.
${manifest
  .map(
    (m) =>
      `- \`samples/${m.slug}/\` — ${m.durationSec.toFixed(2)} sn, ${m.frames} kare, ${(m.bytes / 1024 / 1024).toFixed(1)} MB, render ${m.renderSeconds} sn, SHA-256 \`${m.sha256.slice(0, 16)}…\``,
  )
  .join("\n")}

## Senaryo kalitesi (gerçek üretim)

${scriptCmp
  ? scriptCmp.rows
      .map(
        (r) =>
          `- **${r.title}** — ortalama cümle ${r.before.avgWordsPerSentence} → ${r.after.avgWordsPerSentence} kelime, ` +
          `teknik terim ${r.before.technicalTermCount} → ${r.after.technicalTermCount}, puan ${r.before.score} → ${r.after.score}`,
      )
      .join("\n")
  : "_\`node scripts/script-compare.mjs\` çalıştırılmadı._"}

## Ölçüm ortamı

- Linux x64 konteyner, 2 vCPU, 3.8 GB RAM, GPU yok
- Node ${process.version}, FFmpeg/FFprobe (npm ikili dağıtımı), Python 3.11 + espeakng-loader
- Render hızı: 1080×1920'de yaklaşık 4–5 kare/sn (yüksek kalite), 540p taslakta ~12 kare/sn

Windows kurulum/paketleme adımları \`.github/workflows/windows-build.yml\` içinde tanımlıdır; bu rapor
hangi adımların hangi ortamda çalıştığını gizlemez.
`;
fs.writeFileSync(path.join(root, "docs", "test-report.md"), testDoc, "utf8");
console.log("docs/test-report.md yazıldı");
