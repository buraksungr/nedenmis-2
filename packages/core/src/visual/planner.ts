import type { Domain, KnowledgeCard, MechanismStep } from "../ontology/types.js";
import { normalizeLevel, simplifyNarration, type LanguageLevel } from "../script/style.js";
import { CONCEPTS, conceptLabels } from "../ontology/concepts.js";
import { VISUAL_COMPONENTS, getComponent, schematicDiagram } from "./components/index.js";
import type { VisualComponent } from "./components/types.js";
import { estimateSpeechSeconds, type Scene, type SceneVisualSpec } from "./spec.js";
import { validatePlan } from "./validate.js";
import { normalizeTr } from "../ontology/lexicon.js";

const CAMERA_BY_MECHANISM: Record<string, SceneVisualSpec["camera"]> = {
  crystal_lattice: "zoom_in",
  bond_network: "zoom_in",
  hardness_measure: "static",
  brittleness_compare: "static",
  cleavage_fracture: "zoom_in",
  spectrum_split: "zoom_in",
  rayleigh_scattering: "zoom_out",
  wavelength_scale: "static",
  atmosphere_path: "pan_left",
  rock_weathering: "static",
  river_to_sea: "pan_right",
  ion_solution: "zoom_in",
  evaporation_cycle: "static",
  spacetime_grid: "zoom_out",
  event_horizon: "zoom_in",
  accretion_disk: "zoom_in",
  gravitational_lensing: "zoom_out",
  electron_sea: "zoom_in",
  electron_drift: "pan_right",
  resistance_heat: "zoom_in",
  insulator_compare: "static",
  plate_motion: "pan_right",
  elastic_strain: "zoom_in",
  fault_rupture: "zoom_in",
  seismic_waves: "zoom_out",
  gravity_vectors: "zoom_in",
  free_fall: "static",
  orbit_fall: "zoom_out",
  cell_section: "zoom_in",
  mitochondrion_cross: "zoom_in",
  proton_gradient: "pan_left",
  atp_synthase_rotor: "zoom_in",
  metabolism_summary: "static",
  leaf_section: "zoom_in",
  chloroplast_zoom: "zoom_in",
  light_reaction: "static",
  calvin_cycle: "static",
  neuron_signal: "pan_right",
  synapse_zoom: "zoom_in",
  synaptic_plasticity: "static",
  brain_regions: "zoom_out",
  schematic_diagram: "static",
};

const TRANSITION_BY_INDEX: Scene["transition"][] = ["crossfade", "crossfade", "dip", "crossfade", "slide", "crossfade", "dip"];

export type PlanOptions = {
  targetDurationSec: number;
  /** Kullanıcı belirli adımları seçmek isterse. */
  stepIds?: string[];
  /** Deneysel: bileşen zorla (doğrulayıcı yine denetler). */
  forceComponentId?: string;
  /** Senaryo dil düzeyi (varsayılan: sade). */
  languageLevel?: LanguageLevel;
  /** Görsel karmaşıklığı: sade = en çok 2 etiket, zengin = 4. */
  visualComplexity?: "sade" | "dengeli" | "zengin";
};

export type PlanResult = {
  scenes: Scene[];
  selectedStepIds: string[];
  droppedStepIds: string[];
  estimatedNarrationSec: number;
  notes: string[];
};

/** Kavram/domain/mechanizma uyumuna göre bileşen seçer. */
export function selectComponent(card: KnowledgeCard, step: MechanismStep): { component: VisualComponent; score: number; reason: string } {
  const candidates = VISUAL_COMPONENTS.filter((c) => c.id !== "schematic_diagram")
    .map((c) => {
      const domainMatch = c.domains.some((d) => card.domains.includes(d));
      const mechanismMatch = c.mechanisms.includes(step.mechanism);
      const coverage = step.concepts.filter((id) => c.concepts.includes(id)).length / Math.max(1, step.concepts.length);
      const incompatible = step.concepts.some((id) => c.incompatibleConcepts.includes(id));
      let score = 0;
      if (domainMatch) score += 0.3;
      if (mechanismMatch) score += 0.45;
      score += coverage * 0.35;
      if (incompatible) score -= 1.2;
      return { component: c, score, domainMatch, mechanismMatch, coverage, incompatible };
    })
    .filter((c) => c.mechanismMatch && c.domainMatch && !c.incompatible && c.coverage > 0)
    .sort((a, b) => b.score - a.score);

  if (!candidates.length) {
    return {
      component: schematicDiagram,
      score: 0,
      reason: `'${step.mechanism}' mekanizması için domain uyumlu bileşen bulunamadı; doğrulanmış kavram haritası kullanılıyor.`,
    };
  }
  const best = candidates[0];
  return {
    component: best.component,
    score: best.score,
    reason: `Mekanizma '${step.mechanism}', domain ${card.domains.join("/")} ve ${Math.round(best.coverage * 100)}% kavram kapsamı eşleşti.`,
  };
}

/**
 * Adımın anlatımını dil düzeyine göre seçer.
 * "sade" varsayılandır: kartta yazılmış sade metin varsa o, yoksa otomatik sadeleştirme.
 */
export function sceneNarration(step: MechanismStep, level: LanguageLevel = "simple"): string {
  const normalized = normalizeLevel(level);
  if (normalized === "detailed") return step.narration;
  if (normalized === "standard") return simplifyNarration(step.narrationSimple ?? step.narration, "standard");
  return step.narrationSimple ? simplifyNarration(step.narrationSimple, "simple") : simplifyNarration(step.narration, "simple");
}

/** Görsel karmaşıklığı ayarını etiket üst sınırına çevirir. */
export function maxLabelsFor(complexity?: "sade" | "dengeli" | "zengin"): number | undefined {
  if (complexity === "zengin") return undefined;
  if (complexity === "dengeli") return 3;
  return 2;
}

/** Görsel karmaşıklığına göre etiket sayısını sınırlar (tek fikir = az etiket). */
export function trimLabels(spec: SceneVisualSpec, maxLabels?: number): SceneVisualSpec {
  if (!maxLabels || spec.labels.length <= maxLabels) return spec;
  const labels = spec.labels.slice(0, maxLabels);
  const params = { ...spec.params };
  const labelKeys = Object.keys(params).filter((k) => k.endsWith("Label"));
  for (const key of labelKeys.slice(maxLabels)) delete params[key];
  return { ...spec, labels, params };
}

/** Ekran başlığını dil düzeyine göre seçer (sade düzeyde jargon yerine kısa günlük ifade). */
export function sceneOverlay(step: MechanismStep, level: LanguageLevel = "simple"): string {
  const normalized = normalizeLevel(level);
  if (normalized === "detailed") return step.overlay ?? "";
  return step.overlaySimple ?? step.overlay ?? "";
}

/** Tek bir adımdan sahne kurar (sahne yenileme için de kullanılır). */
export function buildScene(
  card: KnowledgeCard,
  step: MechanismStep,
  index: number,
  forceComponentId?: string,
  level: LanguageLevel = "simple",
  maxLabels?: number,
): Scene {
  const forced = forceComponentId ? getComponent(forceComponentId) : undefined;
  const picked = forced ? { component: forced, reason: "Bileşen kullanıcı tarafından seçildi; doğrulama yine çalıştırılır." } : selectComponent(card, step);
  const spec = trimLabels(buildSpec(card, step, picked.component, level), maxLabels);
  const component = picked.component;
  const scene: Scene = {
    id: `${card.id}-s${index + 1}`,
    index,
    stepId: step.id,
    narration: sceneNarration(step, level),
    narrationScientific: step.narration,
    conceptIds: step.concepts,
    conceptLabels: conceptLabels(step.concepts),
    domain: card.domains[0] as Domain,
    visualObjective:
      component.id === "schematic_diagram"
        ? "Kavramları ve ilişkilerini doğru biçimde göstermek"
        : `${component.labelTr} üzerinden ${conceptLabels(step.concepts).slice(0, 3).join(", ")} ilişkisini açıklamak`,
    overlay: sceneOverlay(step, level),
    spec: { ...spec, rationale: `${spec.rationale} ${picked.reason}` },
    minDuration: step.minDuration ?? 4,
    optional: Boolean(step.optional),
    transition: TRANSITION_BY_INDEX[index % TRANSITION_BY_INDEX.length],
    validation: { status: "approved", checks: [], score: 1 },
  };
  return scene;
}

function buildSpec(card: KnowledgeCard, step: MechanismStep, component: VisualComponent, level: LanguageLevel = "simple"): SceneVisualSpec {
  const params = { ...(step.params ?? {}) };
  if (component.id === "schematic_diagram") {
    params.nodes = step.concepts.filter((id) => CONCEPTS[id]).slice(0, 6);
    params.heading = sceneOverlay(step, level) || "KAVRAM HARİTASI";
  }
  const labels = Object.entries(params)
    .filter(([k, v]) => k !== "focus" && k !== "mode" && k !== "bonds" && typeof v === "string")
    .map(([, v]) => String(v));
  return {
    componentId: component.id,
    mechanism: step.mechanism,
    params,
    concepts: step.concepts,
    labels,
    camera: CAMERA_BY_MECHANISM[step.mechanism] ?? "static",
    background: card.domains[0],
    rationale: `Sahne, "${step.narration.slice(0, 60)}…" anlatımındaki ${conceptLabels(step.concepts).slice(0, 4).join(", ")} kavramlarını göstermek için ${component.labelTr} bileşenini kullanır.`,
    scientificNote: component.scientificNote,
  };
}

/**
 * Hedef süreye göre adım seçimi.
 *
 * Anlatım uzunsa kısa videoyu doldurmak için sahne germek yerine, giriş ve
 * sonuç korunup aradaki mekanizma adımları bütçeye sığdıkça eklenir.
 * (Sessiz kesme veya anlatım kırpma yapılmaz.)
 */
export function selectSteps(
  card: KnowledgeCard,
  targetDurationSec: number,
  stepIds?: string[],
  level: LanguageLevel = "simple",
): { selected: MechanismStep[]; dropped: MechanismStep[] } {
  const steps = card.steps.filter((s) => !stepIds || stepIds.includes(s.id));
  if (stepIds) return { selected: steps, dropped: [] };
  if (!steps.length) return { selected: [], dropped: [] };
  const overhead = 0.45;
  // Süre bütçesi, seçilen dil düzeyinde gerçekten okunacak metne göre hesaplanır.
  const cost = (s: MechanismStep) => estimateSpeechSeconds(sceneNarration(s, level)) + overhead;

  // Bütçe, ölçülen TTS süresinin tahminden uzun çıkabildiği gerçeğine göre dar tutulur.
  const budget = targetDurationSec * 0.95;
  const first = steps[0];
  const closing = steps.length > 1 ? steps[steps.length - 1] : undefined;
  const middle = steps.slice(1, steps.length - 1).filter((s) => !s.optional);
  const middleOptional = steps.slice(1, steps.length - 1).filter((s) => s.optional);

  const selected: MechanismStep[] = [first];
  let total = cost(first);
  const closingCost = closing ? cost(closing) : 0;

  // Kapanış (sonuç) sahnesi yapıyı tamamlar; bütçe elverdiğince her zaman korunur.
  let closingKept = false;
  if (closing && total + closingCost <= budget) {
    selected.push(closing);
    total += closingCost;
    closingKept = true;
  }
  const allCost = steps.reduce((sum, s) => sum + cost(s), 0);
  if (allCost <= targetDurationSec * 1.02) {
    // Tüm adımlar hedefe sığıyorsa hiçbiri atılmaz (kapanış dahil tam yapı).
    return { selected: [...steps], dropped: [] };
  }
  // Ara adımlar sırayla eklenir: mekanizma zinciri bölünmez (neden-sonuç akışı korunur).
  for (const s of middle) {
    const reserve = closingKept ? 0 : closingCost;
    if (total + cost(s) + reserve > budget) break;
    selected.push(s);
    total += cost(s);
  }
  for (const s of middleOptional) {
    if (total + cost(s) <= budget) {
      selected.push(s);
      total += cost(s);
    }
  }
  if (closing && !closingKept && total + closingCost <= budget) {
    selected.push(closing);
    total += closingCost;
  }

  const order = new Map(steps.map((s, i) => [s.id, i]));
  selected.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  const selectedIds = new Set(selected.map((s) => s.id));
  return { selected, dropped: steps.filter((s) => !selectedIds.has(s.id)) };
}

/** Bilgi kartından sahne planı üretir ve bilimsel doğrulamayı çalıştırır. */
export function planScenes(card: KnowledgeCard, opts: PlanOptions): PlanResult {
  const { selected, dropped } = selectSteps(card, opts.targetDurationSec, opts.stepIds, opts.languageLevel ?? "simple");
  const notes: string[] = [];
  if (dropped.length) notes.push(`Süre hedefi için ${dropped.length} isteğe bağlı sahne dışarıda bırakıldı.`);

  const scenes: Scene[] = selected.map((step, i) => {
    const scene = buildScene(card, step, i, opts.forceComponentId, opts.languageLevel, maxLabelsFor(opts.visualComplexity));
    if (scene.spec.componentId === "schematic_diagram") {
      notes.push(`"${step.overlay ?? step.id}" sahnesi için mekanizma bileşeni yok; kavram haritası kullanıldı.`);
    }
    return scene;
  });

  const validated = validatePlan(card, scenes);
  const estimate = scenes.reduce((acc, s) => acc + estimateSpeechSeconds(s.narration), 0);
  return {
    scenes: validated.scenes,
    selectedStepIds: selected.map((s) => s.id),
    droppedStepIds: dropped.map((s) => s.id),
    estimatedNarrationSec: estimate,
    notes,
  };
}

/** Serbest metin düzenlemesinden sonra sahne kavramlarını yeniden kontrol etmek için. */
export function narrationHitsConcept(narration: string, conceptIds: string[]): string[] {
  const norm = ` ${normalizeTr(narration)} `;
  return conceptIds.filter((id) => {
    const c = CONCEPTS[id];
    if (!c) return false;
    return c.aliases.some((a) => norm.includes(` ${normalizeTr(a)} `) || norm.includes(normalizeTr(a)));
  });
}
