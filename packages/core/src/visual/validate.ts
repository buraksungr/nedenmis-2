import type { KnowledgeCard } from "../ontology/types.js";
import { CONCEPTS } from "../ontology/concepts.js";
import { detectFamilies, normalizeTr } from "../ontology/lexicon.js";
import { getComponent } from "./components/index.js";
import type { Scene, SceneValidation, ValidationCheck } from "./spec.js";

export type ValidationReport = {
  scenes: Scene[];
  status: "approved" | "rejected";
  summary: string;
  errors: number;
  warnings: number;
  checks: ValidationCheck[];
};

const FAMILY_DOMAINS: Record<string, string[]> = {
  biology: ["biology"],
  materials: ["materials", "chemistry"],
  astronomy: ["astronomy", "physics"],
  geology: ["geology", "earth"],
  optics: ["physics", "earth"],
  electricity: ["physics", "technology", "engineering"],
};

const GENERIC_TOKENS = new Set([
  "ve", "ile", "bir", "bu", "şu", "çok", "daha", "gibi", "kadar", "için", "olan", "olur",
  "yani", "ama", "fakat", "veya", "sonra", "önce", "şey", "her", "tüm", "göre", "yaklaşık",
  "yüksek", "düşük", "büyük", "küçük", "sağ", "sol", "üst", "alt", "iç", "dış", "yön",
  "nm", "mm", "cm", "km", "kg", "sn", "ms", "hz", "ph", "atp", "co₂", "o₂", "h₂o",
]);

function labelTokens(label: string): string[] {
  return normalizeTr(label)
    .split(" ")
    .filter((t) => t.length >= 3 && /[a-zçğıöşü]/.test(t) && !GENERIC_TOKENS.has(t) && !/^\d+$/.test(t));
}

function aliasTokenSet(card: KnowledgeCard): Set<string> {
  const set = new Set<string>();
  for (const id of card.concepts) {
    const c = CONCEPTS[id];
    if (!c) continue;
    for (const a of [c.labelTr, c.diagramLabel, ...c.aliases]) {
      for (const tok of normalizeTr(a).split(" ")) if (tok.length >= 2) set.add(tok);
    }
  }
  for (const tok of normalizeTr(card.topicTitleTr).split(" ")) if (tok.length >= 2) set.add(tok);
  return set;
}

function check(code: string, ok: boolean, message: string, severity: ValidationCheck["severity"]): ValidationCheck {
  return { code, ok, message, severity };
}

/** Bir sahnenin görsel planını anlatıma ve bilgi kartına karşı doğrular. */
export function validateScene(card: KnowledgeCard, scene: Scene): SceneValidation {
  const checks: ValidationCheck[] = [];
  const component = getComponent(scene.spec.componentId);

  // 1. Bileşen mevcut mu?
  checks.push(
    check(
      "V_COMPONENT_EXISTS",
      Boolean(component),
      component ? `Görsel bileşen bulundu: ${component.labelTr}.` : `Görsel bileşen tanımlı değil: ${scene.spec.componentId}.`,
      "error",
    ),
  );
  if (!component) {
    return { status: "rejected", checks, score: 0 };
  }

  const isSchematic = component.id === "schematic_diagram";

  // 2. Domain uyumu: biyoloji bileşeni malzeme konusunda kullanılamaz.
  const domainMatch = component.domains.some((d) => card.domains.includes(d));
  checks.push(
    check(
      "V_DOMAIN_MATCH",
      domainMatch,
      domainMatch
        ? `Bileşen domaini (${component.domains.join("/")}) konu domainiyle (${card.domains.join("/")}) uyumlu.`
        : `Bileşen domaini (${component.domains.join("/")}) konu domainiyle (${card.domains.join("/")}) uyuşmuyor.`,
      "error",
    ),
  );

  // 3. Mekanizma desteği.
  const mechanismMatch = isSchematic || component.mechanisms.includes(scene.spec.mechanism);
  checks.push(
    check(
      "V_MECHANISM_MATCH",
      mechanismMatch,
      mechanismMatch
        ? `Bileşen '${scene.spec.mechanism}' mekanizmasını destekliyor.`
        : `Bileşen '${scene.spec.mechanism}' mekanizmasını desteklemiyor (desteklediği: ${component.mechanisms.join(", ")}).`,
      isSchematic ? "warning" : "error",
    ),
  );

  // 4. Yasak kavramlar (ör. elmasta hücre).
  const forbiddenHit = component.concepts.filter((id) => card.forbiddenConcepts.includes(id));
  checks.push(
    check(
      "V_FORBIDDEN_CONCEPT",
      forbiddenHit.length === 0,
      forbiddenHit.length === 0
        ? "Yasaklı kavram içermiyor."
        : `Bileşen bu konu için yasaklı kavramlar içeriyor: ${forbiddenHit.join(", ")}.`,
      "error",
    ),
  );

  // 5. Bileşen konuyla ilgili mi? (en az bir kavram örtüşmesi)
  const relevance = component.concepts.filter((id) => card.concepts.includes(id));
  checks.push(
    check(
      "V_COMPONENT_RELEVANT",
      isSchematic || relevance.length > 0,
      isSchematic
        ? "Şematik diyagram, kart kavramlarından üretilir."
        : relevance.length > 0
          ? `Bileşen konu kavramlarıyla örtüşüyor: ${relevance.slice(0, 5).join(", ")}.`
          : "Bileşen konunun kavramlarıyla hiç örtüşmüyor; görsel konuyla ilgisiz olur.",
      "error",
    ),
  );

  // 6. Sahne kavramları kart kavramlarından mı?
  const ungrounded = scene.conceptIds.filter((id) => !card.concepts.includes(id) && !CONCEPTS[id]);
  checks.push(
    check(
      "V_CONCEPT_SCOPE",
      ungrounded.length === 0,
      ungrounded.length === 0 ? "Sahne kavramları bilgi kartında tanımlı." : `Bilinmeyen kavramlar: ${ungrounded.join(", ")}.`,
      "error",
    ),
  );

  // 7. Anlatım ↔ görsel bağı: anlatımda geçen bir kavramı bileşen gerçekten gösteriyor mu?
  const narrationNorm = ` ${normalizeTr(scene.narration)} `;
  // Sade dilde anlatımda jargon bulunmaz; kavram bağı bilimsel metinle birlikte değerlendirilir.
  const scientificNorm = scene.narrationScientific ? ` ${normalizeTr(scene.narrationScientific)} ` : " ";
  const narratedConcepts = scene.conceptIds.filter((id) => {
    const c = CONCEPTS[id];
    return c ? c.aliases.some((a) => narrationNorm.includes(normalizeTr(a)) || scientificNorm.includes(normalizeTr(a))) : false;
  });
  const shown = narratedConcepts.filter((id) => isSchematic || component.concepts.includes(id));
  const linkOk = isSchematic || shown.length > 0;
  checks.push(
    check(
      "V_NARRATION_VISUAL_LINK",
      linkOk,
      linkOk
        ? `Anlatımdaki kavramlar görselde karşılık buluyor: ${(isSchematic ? scene.conceptIds : shown).slice(0, 4).join(", ")}.`
        : "Anlatımda geçen kavramların hiçbiri seçilen görsel bileşende yok.",
      linkOk ? "info" : "error",
    ),
  );

  // 8. Yanlış bilgi (kartın yanlış iddia listesi anlatımda geçiyor mu?)
  const claimHits = card.misconceptions.filter((m) => {
    const claim = normalizeTr(m.claim);
    return claim.length > 8 && (narrationNorm.includes(claim) || scientificNorm.includes(claim));
  });
  checks.push(
    check(
      "V_MISCONCEPTION",
      claimHits.length === 0,
      claimHits.length === 0 ? "Anlatımda bilinen yanlış iddia yok." : `Anlatım yanlış iddia içeriyor: ${claimHits[0].claim}`,
      "error",
    ),
  );

  // 9. Etiketler kart kavramlarına dayanıyor mu? Yabancı domain etiketi = hata.
  const allowed = aliasTokenSet(card);
  const foreign: string[] = [];
  const ungroundedLabels: string[] = [];
  for (const lab of [...scene.spec.labels, scene.overlay]) {
    for (const tok of labelTokens(lab)) {
      if (allowed.has(tok)) continue;
      const families = detectFamilies(tok);
      const bad = families.some((f) => !(FAMILY_DOMAINS[f] ?? []).some((d) => card.domains.includes(d as never)));
      if (bad) foreign.push(tok);
      else ungroundedLabels.push(tok);
    }
  }
  checks.push(
    check(
      "V_LABEL_FOREIGN_DOMAIN",
      foreign.length === 0,
      foreign.length === 0 ? "Görsel etiketler konuyla aynı bilim alanından." : `Görsel etiketlerde yabancı kavramlar var: ${[...new Set(foreign)].join(", ")}.`,
      "error",
    ),
  );
  checks.push(
    check(
      "V_LABEL_GROUNDING",
      ungroundedLabels.length === 0,
      ungroundedLabels.length === 0 ? "Tüm etiketler kavram sözlüğüne dayanıyor." : `Kavram sözlüğünde karşılığı olmayan etiketler: ${[...new Set(ungroundedLabels)].slice(0, 6).join(", ")}.`,
      "warning",
    ),
  );

  // 10. Şema geri dönüşü bilgilendirmesi.
  if (isSchematic) {
    checks.push(
      check("V_SCHEMATIC_FALLBACK", true, "Bu sahne için mekanizma animasyonu yok; doğru şematik diyagram kullanıldı.", "warning"),
    );
  }

  const errors = checks.filter((c) => !c.ok && c.severity === "error").length;
  const warnings = checks.filter((c) => !c.ok && c.severity === "warning").length;
  const passed = checks.filter((c) => c.ok).length;
  const score = Math.round(((passed / Math.max(1, checks.length)) * 100 - warnings * 4) * 10) / 10;

  return { status: errors > 0 ? "rejected" : "approved", checks, score: Math.max(0, score) };
}

/** Tüm sahne planını doğrular; reddedilen sahne varsa rapor 'rejected' olur. */
export function validatePlan(card: KnowledgeCard, scenes: Scene[]): ValidationReport {
  const validated = scenes.map((s) => ({ ...s, validation: validateScene(card, s) }));
  const errors = validated.reduce((acc, s) => acc + s.validation.checks.filter((c) => !c.ok && c.severity === "error").length, 0);
  const warnings = validated.reduce((acc, s) => acc + s.validation.checks.filter((c) => !c.ok && c.severity === "warning").length, 0);
  const rejected = validated.filter((s) => s.validation.status === "rejected");
  const checks = validated.flatMap((s) => s.validation.checks.map((c) => ({ ...c, code: `${s.id}:${c.code}` })));
  const status = rejected.length ? "rejected" : "approved";
  const summary =
    status === "approved"
      ? `${validated.length} sahnenin tamamı bilimsel görsel doğrulamadan geçti (${warnings} uyarı).`
      : `${rejected.length} sahne reddedildi: ${rejected.map((s) => s.id).join(", ")}. Toplam ${errors} hata.`;
  return { scenes: validated, status, summary, errors, warnings, checks };
}

export class VisualValidationError extends Error {
  report: ValidationReport;
  constructor(report: ValidationReport) {
    const failures = report.checks.filter((c) => !c.ok && c.severity === "error").slice(0, 6);
    super(`Görsel doğrulama başarısız (${report.errors} hata). ${failures.map((f) => f.message).join(" | ")}`);
    this.name = "VisualValidationError";
    this.report = report;
  }
}

/** Render öncesi zorunlu kapı: doğrulanmamış görsel planı üretime geçemez. */
export function assertApproved(card: KnowledgeCard, scenes: Scene[]): ValidationReport {
  const report = validatePlan(card, scenes);
  if (report.status !== "approved") throw new VisualValidationError(report);
  return report;
}
