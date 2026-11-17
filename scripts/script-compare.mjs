// Senaryo öncesi/sonrası karşılaştırma raporu.
//   node scripts/script-compare.mjs
//
// "Önce" = v1.0.1'e kadar kullanılan akademik dildeki anlatım (arşiv metni).
// "Sonra" = bu sürümde sade dil düzeyinde üretilen gerçek anlatım (bilgi kartından).
// Ölçümler packages/core/src/script/style.ts değerlendiricisiyle hesaplanır.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const dist = path.resolve("packages/core/dist");
const { evaluateScript } = require(path.join(dist, "script/style.js"));
const { getCard } = require(path.join(dist, "ontology/resolve.js"));
const { planScenes } = require(path.join(dist, "visual/planner.js"));

const BEFORE = {
  "diamond-hardness": [
    "Elmasın üç boyutlu tetrahedral kristal kafes yapısı, karbon atomları arasındaki güçlü kovalent bağlarla meydana gelir.",
    "Bu bağ ağı, ona çok yüksek sertlik kazandırır; ancak sertlik ile tokluk farklı özelliklerdir ve elmas gevrektir.",
    "Kristal, belirli düşük endeksli dilimlenme düzlemlerinde daha zayıf bağ yoğunluğuna sahiptir.",
    "Bir darbe çatlak başlatırsa, çatlak bu düzlemi izleyerek ses hızı mertebesinde ilerler ve makroskobik kırılma gerçekleşir.",
  ],
  "sky-blue": [
    "Güneş ışınımı, atmosferdeki moleküller tarafından Rayleigh saçılmasına uğratılır.",
    "Saçılma tesir kesiti dalga boyunun dördüncü kuvvetiyle ters orantılıdır; bu nedenle kısa dalga boylu bileşenler baskın hâle gelir.",
    "Gözlemciye ulaşan dağınık ışınımın tayfsal dağılımı, mavi bölgede belirgin biçimde yükselir.",
    "Güneş ufka yakınken optik yol uzunluğu arttığından kısa dalga boylu bileşenler absorbe ve saçılmaya uğrar; geriye kırmızı-turuncu bölge kalır.",
  ],
  "ocean-salty": [
    "Deniz suyunun tuzluluğunun başlıca kaynağı, kıtasal kabukta gerçekleşen kimyasal ayrışma süreçleridir.",
    "Atmosferik karbondioksitin çözünmesiyle oluşan karbonik asit, silikat ve karbonat minerallerini iyonlaştırır.",
    "Akarsu ağı, çözünmüş iyonları hidrolojik döngü aracılığıyla okyanus havzasına taşır.",
    "Buharlaşma sırasında su molekülleri faz değiştirirken çözünmüş tuzlar geride kalır; tuzluluk jeolojik zaman ölçeğinde artar.",
  ],
  "black-hole": [
    "Kara delikler, genel görelilik denklemlerinin küresel simetrik vakum çözümü olan Schwarzschild metriğiyle tanımlanır.",
    "Olay ufku, kaçış hızının ışık hızına eşitlendiği koordinat yüzeyidir; nedensel olarak iç bölge dış evrenle bağlantısızdır.",
    "Yığılma diski içinde viskoz açısal momentum transferi maddeyi ısıtır ve X-ışını bölgesinde ışınım üretir.",
    "Kütle çekimsel mercekleme, arka plan kaynaklarının çoklu görüntülerinin ve Einstein halkalarının gözlenmesini sağlar.",
  ],
};

const TOPICS = ["diamond-hardness", "sky-blue", "ocean-salty", "black-hole"];

function metrics(text) {
  const q = evaluateScript(text, "simple");
  return {
    score: q.score,
    ok: q.ok,
    sentences: q.sentences ?? undefined,
    avgWordsPerSentence: q.avgWordsPerSentence,
    longestSentenceWords: q.longestSentenceWords,
    technicalTermCount: q.technicalTermCount,
    technicalTerms: q.technicalTerms.map((t) => t.term),
    hook: q.hook,
    issues: q.issues.map((i) => i.code),
    wordCount: text.trim().split(/\s+/).filter(Boolean).length,
  };
}

const rows = [];
for (const id of TOPICS) {
  const card = getCard(id);
  if (!card) throw new Error(`Bilgi kartı yok: ${id}`);
  const plan = planScenes(card, { targetDurationSec: 45, languageLevel: "simple" });
  const beforeText = BEFORE[id].join(" ");
  const afterText = plan.scenes.map((s) => s.narration).join(" ");
  const before = metrics(beforeText);
  const after = metrics(afterText);
  rows.push({
    cardId: id,
    title: card.topicTitleTr,
    before: { text: beforeText, ...before },
    after: {
      text: afterText,
      ...after,
      sentences: plan.scenes.map((s) => ({ stepId: s.stepId, overlay: s.overlay, narration: s.narration })),
    },
    delta: {
      avgSentence: Math.round((after.avgWordsPerSentence - before.avgWordsPerSentence) * 10) / 10,
      technicalTerms: after.technicalTermCount - before.technicalTermCount,
      score: after.score - before.score,
    },
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  engine: "core script evaluator (sade dil eşikleri)",
  note:
    "Önce: v1.0.1 akademik anlatım (arşiv). Sonra: bu sürümde bilgi kartından üretilen gerçek sade anlatım. " +
    "Bilimsel içerik aynıdır; yalnızca dil sadeleşir.",
  rows,
};

const md = [];
md.push("# Senaryo öncesi / sonrası karşılaştırma");
md.push("");
md.push(`_Oluşturma: ${report.generatedAt}_`);
md.push("");
md.push(
  "Bu rapor gerçek verilerle üretilir (`node scripts/script-compare.mjs`). \"Önce\" metni v1.0.1'de kullanılan " +
    "akademik anlatımdır; \"sonra\" metni bu sürümde bilgi kartından üretilen sade anlatımdır. " +
    "Ölçümler `packages/core/src/script/style.ts` içindeki değerlendiriciyle hesaplanır.",
);
md.push("");
md.push("## Özet");
md.push("");
md.push("| Konu | Ort. kelime/cümle | En uzun cümle | Teknik terim | Puan | Sade dil kapısı |");
md.push("| --- | --- | --- | --- | --- | --- |");
for (const r of rows) {
  md.push(
    `| ${r.title} | ${r.before.avgWordsPerSentence} → **${r.after.avgWordsPerSentence}** | ` +
      `${r.before.longestSentenceWords} → **${r.after.longestSentenceWords}** | ` +
      `${r.before.technicalTermCount} → **${r.after.technicalTermCount}** | ` +
      `${r.before.score} → **${r.after.score}** | ${r.before.ok ? "geçti" : "**kaldı**"} → ${r.after.ok ? "**geçti**" : "kaldı"} |`,
  );
}
md.push("");
for (const r of rows) {
  md.push(`## ${r.title}`);
  md.push("");
  md.push("**Önce (akademik):**");
  md.push("");
  md.push(r.before.text);
  md.push("");
  md.push("**Sonra (sade, gerçek üretim):**");
  md.push("");
  for (const s of r.after.sentences) md.push(`- **${s.overlay}** — ${s.narration}`);
  md.push("");
  md.push(
    `Ölçüm: ortalama cümle ${r.before.avgWordsPerSentence} → ${r.after.avgWordsPerSentence} kelime, ` +
      `teknik terim ${r.before.technicalTermCount} → ${r.after.technicalTermCount}, ` +
      `puan ${r.before.score} → ${r.after.score}.`,
  );
  md.push("");
}

const docsPath = path.resolve("docs/before-after-script.md");
const reportsDir = path.resolve("reports");
fs.mkdirSync(reportsDir, { recursive: true });
fs.mkdirSync(path.dirname(docsPath), { recursive: true });
fs.writeFileSync(docsPath, md.join("\n"), "utf8");
fs.writeFileSync(path.join(reportsDir, "script-comparison.json"), JSON.stringify(report, null, 2), "utf8");

console.log("Senaryo karşılaştırması");
for (const r of rows) {
  console.log(
    `  ${r.title}: ort ${r.before.avgWordsPerSentence} → ${r.after.avgWordsPerSentence} kelime, ` +
      `terim ${r.before.technicalTermCount} → ${r.after.technicalTermCount}, puan ${r.before.score} → ${r.after.score}`,
  );
}
console.log(`  -> ${path.relative(process.cwd(), docsPath)}`);
console.log(`  -> ${path.relative(process.cwd(), path.join(reportsDir, "script-comparison.json"))}`);

const allImproved = rows.every(
  (r) =>
    r.after.avgWordsPerSentence < r.before.avgWordsPerSentence &&
    r.after.technicalTermCount <= r.before.technicalTermCount &&
    r.after.ok,
);
if (!allImproved) {
  console.error("HATA: en az bir konuda sade anlatım eskisinden daha kolay değil.");
  process.exit(1);
}
