import assert from "node:assert/strict";
import { test } from "node:test";
import { createProject } from "../../packages/core/src/project/pipeline.ts";
import { getCard, KNOWLEDGE_CARDS } from "../../packages/core/src/ontology/resolve.ts";
import { evaluateScript, ensureSimple, simplifyNarration, normalizeLevel } from "../../packages/core/src/script/style.ts";
import { planScenes, sceneOverlay, sceneNarration } from "../../packages/core/src/visual/planner.ts";

const JARGON = [
  "kovalent",
  "tetrahedral",
  "kristal kafes",
  "rayleigh",
  "olay ufku",
  "hidratasyon",
  "proton eğimi",
  "atp sentaz",
  "kalvin",
  "nörotransmitter",
  "uzun süreli güçlenme",
  "elastik enerji",
  "iyon",
];

const REQUIRED_TOPICS = [
  "Elmas neden kolay kırılmaz?",
  "Gökyüzü neden mavi?",
  "Denizler neden tuzlu?",
  "Kara delikler nasıl çalışır?",
];

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

test("varsayılan dil düzeyi her zaman sade", () => {
  for (const topic of REQUIRED_TOPICS) {
    const { project } = createProject({ topic, targetDurationSec: 30 });
    assert.equal(project.languageLevel, "simple", `${topic}: varsayılan düzey sade olmalı`);
  }
  assert.equal(normalizeLevel(undefined), "simple");
  assert.equal(normalizeLevel("Detailed"), "detailed");
});

/** v1.0.1'e kadar kullanılan akademik elmas anlatımı (karşılaştırma tabanı). */
const BEFORE_ACADEMIC =
  "Elmasın üç boyutlu tetrahedral kristal kafes yapısı, karbon atomları arasındaki güçlü kovalent bağlarla meydana gelir. " +
  "Bu bağ ağı, ona çok yüksek sertlik kazandırır; ancak sertlik ile tokluk farklı özelliklerdir ve elmas gevrektir. " +
  "Kristal, belirli düşük endeksli dilimlenme düzlemlerinde daha zayıf bağ yoğunluğuna sahiptir; bir darbe çatlak başlatırsa " +
  "çatlak bu düzlemi izleyerek ses hızı mertebesinde ilerler.";

test("elmas: yeni anlatım eski akademik anlatımdan belirgin biçimde daha kolay", () => {
  const card = getCard("diamond-hardness")!;
  const after = card.steps.map((s) => sceneNarration(s, "simple")).join(" ");

  const beforeQ = evaluateScript(BEFORE_ACADEMIC, "simple");
  const afterQ = evaluateScript(after, "simple");

  assert.equal(beforeQ.ok, false, "eski akademik anlatım sade dil kapısından geçmemeli");
  assert.equal(afterQ.ok, true, "yeni sade anlatım kapıdan geçmeli");
  assert.ok(
    afterQ.avgWordsPerSentence < beforeQ.avgWordsPerSentence * 0.6,
    `ortalama cümle uzunluğu belirgin düşmeli (önce ${beforeQ.avgWordsPerSentence}, sonra ${afterQ.avgWordsPerSentence})`,
  );
  assert.ok(afterQ.technicalTermCount < beforeQ.technicalTermCount, "teknik terim sayısı azalmalı");
  assert.ok(afterQ.score > beforeQ.score + 10, `kalite puanı belirgin artmalı (önce ${beforeQ.score}, sonra ${afterQ.score})`);
  assert.ok(afterQ.longestSentenceWords <= 14, `en uzun cümle 14 kelimeyi aşmamalı (${afterQ.longestSentenceWords})`);
});

test("elmas kartı: sade metin jargonu bırakır, akademik metin korunur", () => {
  const card = getCard("diamond-hardness")!;
  const before = card.steps.map((s) => s.narration).join(" ").toLowerCase();
  const after = card.steps.map((s) => sceneNarration(s, "simple")).join(" ").toLowerCase();
  assert.ok(before.includes("kovalent"), "bilimsel metin terimi korur (iç doğruluk)");
  assert.ok(!after.includes("kovalent"), "sade metinde terim kalmaz");
  assert.ok(!after.includes("gevreklik"), "sade metinde jargon kalmaz");
  const beforeQ = evaluateScript(before, "simple");
  const afterQ = evaluateScript(after, "simple");
  assert.ok(afterQ.avgWordsPerSentence <= beforeQ.avgWordsPerSentence, "ortalama cümle uzunluğu artmamalı");
  assert.ok(afterQ.longestSentenceWords <= 14);
});

test("sade anlatım bilimsel içeriği korur (anahtar kavramlar duruyor)", () => {
  const card = getCard("diamond-hardness")!;
  const simple = card.steps.map((s) => sceneNarration(s, "simple")).join(" ").toLowerCase();
  for (const anchor of ["karbon", "atom", "sert", "kırıl", "çatlak"]) {
    assert.ok(simple.includes(anchor), `sade metinde "${anchor}" geçmeli`);
  }
  // Yanlış bilgiye dönüşmemeli: "elmas kırılmaz" iddiası sade metinde geçmiyor.
  assert.ok(!/elmas[^.]{0,20}kırılmaz\b(?! yapmaz)/.test(simple) || simple.includes("kırılmaz yapm"), "kırılmaz iddiası korunmamalı");
});

test("sade ekran başlıkları jargon içermez, ayrıntılı düzey bilimsel başlığı korur", () => {
  const card = getCard("black-hole")!;
  for (const step of card.steps) {
    const simple = sceneOverlay(step, "simple").toLowerCase();
    const detailed = sceneOverlay(step, "detailed").toLowerCase();
    assert.ok(simple.length <= 24, `"${simple}" çok uzun bir ekran başlığı`);
    for (const term of ["kovalent", "rayleigh", "hidratasyon", "proton eğimi", "atp sentaz", "kalvin"]) {
      assert.ok(!simple.includes(term), `sade başlık jargon içeriyor: ${simple}`);
    }
    if (step.overlaySimple) assert.equal(detailed, (step.overlay ?? "").toLowerCase());
  }
});

test("sadeleştirici kelimeleri bozmaz (Türkçe ek yığılması yok)", () => {
  const samples = [
    "Kovalent bağlar elması sert yapar.",
    "Tetrahedral kristal kafes yapısı çok güçlüdür.",
    "Rayleigh saçılması mavi ışığı daha çok dağıtır.",
    "Bu olay hidratasyon olarak adlandırılır.",
  ];
  for (const text of samples) {
    const out = simplifyNarration(text, "simple");
    assert.ok(!/larla?rla|larılar|sısı|çok güçlü çok güçlü/.test(out), `bozuk çıktı: ${out}`);
    assert.ok(!/[A-Za-zÇĞİÖŞÜçğıöşü]{2,}(lar|ler){2}/.test(out), `yinelenen ek: ${out}`);
    const q = evaluateScript(out, "simple");
    assert.equal(q.ok, true, `sadeleştirilmiş metin kapıdan geçmeli: ${out}`);
  }
});

test("kanca ilk iki cümlede aranır", () => {
  const ok = evaluateScript("Elmas çok serttir. Peki neden kırılır? Bu ilginç.", "simple");
  assert.equal(ok.hook.ok, true);
  const weak = evaluateScript("Elmas bir mineraldir. Karbon atomlarından oluşur. Serttir.", "simple");
  assert.equal(weak.hook.ok, false);
});

test("sade dilde her konu doğrulamadan geçer ve süre hedefe yakın kalır", () => {
  for (const card of KNOWLEDGE_CARDS) {
    const { project } = createProject({ topic: card.topicTitleTr, targetDurationSec: 30 });
    assert.equal(project.validation?.status, "approved", `${card.id}: görsel doğrulama onaylı olmalı`);
    assert.ok(project.scenes.length >= 2, `${card.id}: en az 2 sahne`);
    assert.ok(project.scriptQuality?.ok, `${card.id}: senaryo kalite kapısı geçilmeli`);
    const ratio = project.script.estimatedSec / project.targetDurationSec;
    assert.ok(ratio > 0.35 && ratio <= 1.25, `${card.id}: tahmini süre hedefe yakın olmalı (${project.script.estimatedSec}/${project.targetDurationSec})`);
  }
});

test("hedef süre kapanış sahnesini korur (yapı: kanca → açıklama → sonuç)", () => {
  const card = getCard("diamond-hardness")!;
  for (const target of [20, 30, 45]) {
    const { project } = createProject({ topic: card.topicTitleTr, targetDurationSec: target });
    const stepIds = project.scenes.map((s) => s.stepId);
    assert.equal(stepIds[0], card.steps[0].id, `${target}s: kanca ilk sahne olmalı`);
    assert.equal(stepIds[stepIds.length - 1], card.steps[card.steps.length - 1].id, `${target}s: kapanış son sahne olmalı`);
  }
});

test("ayrıntılı düzey bilimsel metni olduğu gibi korur", () => {
  const card = getCard("sky-blue")!;
  const { project } = createProject({ topic: card.topicTitleTr, targetDurationSec: 45, languageLevel: "detailed" });
  assert.equal(project.languageLevel, "detailed");
  for (const scene of project.scenes) {
    const step = card.steps.find((s) => s.id === scene.stepId)!;
    assert.equal(scene.narration, step.narration, "ayrıntılı düzeyde anlatım değiştirilmemeli");
  }
});

test("görsel karmaşıklık etiket sayısını sınırlar", () => {
  const card = getCard("diamond-hardness")!;
  const simple = planScenes(card, { targetDurationSec: 45, visualComplexity: "sade" });
  const rich = planScenes(card, { targetDurationSec: 45, visualComplexity: "zengin" });
  for (const scene of simple.scenes) {
    assert.ok(scene.spec.labels.length <= 2, `sade görselde en fazla 2 etiket (${scene.spec.labels.length})`);
  }
  const simpleLabels = simple.scenes.reduce((n, s) => n + s.spec.labels.length, 0);
  const richLabels = rich.scenes.reduce((n, s) => n + s.spec.labels.length, 0);
  assert.ok(richLabels >= simpleLabels, "zengin görselde etiket sayısı azalmamalı");
});

test("altyazı anahtarı dışa aktarma ayarına geçer", () => {
  const on = createProject({ topic: "Gökyüzü neden mavi?", targetDurationSec: 30 }).project;
  assert.equal(on.exportSettings.subtitles, true);
  const off = createProject({ topic: "Gökyüzü neden mavi?", targetDurationSec: 30, subtitles: false }).project;
  assert.equal(off.exportSettings.subtitles, false);
});

test("ensureSimple sade metni daha da bozmaz", () => {
  const text = "Elmas serttir ama kırılabilir.";
  const result = ensureSimple(text, "simple");
  assert.equal(result.passes, 0, "zaten sade metin yeniden yazılmamalı");
  assert.equal(result.text, text);
  assert.equal(result.quality.ok, true);
});

test("senaryo kalitesi projede saklanır ve sahne metinleriyle tutarlıdır", () => {
  const { project } = createProject({ topic: "Kara delikler nasıl çalışır?", targetDurationSec: 30 });
  const quality = project.scriptQuality!;
  assert.ok(quality.score > 0 && quality.score <= 100);
  assert.equal(quality.avgWordsPerSentence > 0, true);
  const recomputed = evaluateScript(project.scenes.map((s) => s.narration).join(" "), project.languageLevel);
  assert.equal(Math.round(recomputed.avgWordsPerSentence * 10), Math.round(quality.avgWordsPerSentence * 10));
  assert.ok(words(project.script.text) > 20);
  // Sade senaryoda jargon bulunmamalı.
  const lower = project.script.text.toLowerCase();
  for (const term of JARGON) {
    assert.ok(!lower.includes(term), `sade senaryoda jargon var: ${term}`);
  }
});
