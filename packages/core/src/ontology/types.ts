/**
 * Nedenmiş Studio — bilimsel bilgi modeli.
 *
 * Tasarım kararı: görseller konu adına değil, KAVRAM ve MEKANİZMAYA bağlanır.
 * Böylece "elmas" konusuna hücre çizilemez; hücre bileşeni biyoloji domain'ine
 * ve hücre kavramlarına bağlıdır, malzeme konusuyla eşleşmez.
 */

export type Domain =
  | "physics"
  | "chemistry"
  | "biology"
  | "astronomy"
  | "geology"
  | "materials"
  | "mathematics"
  | "engineering"
  | "technology"
  | "earth"
  | "environment";

export const DOMAIN_TR: Record<Domain, string> = {
  physics: "Fizik",
  chemistry: "Kimya",
  biology: "Biyoloji",
  astronomy: "Astronomi",
  geology: "Jeoloji",
  materials: "Malzeme bilimi",
  mathematics: "Matematik",
  engineering: "Mühendislik",
  technology: "Teknoloji",
  earth: "Yer bilimleri",
  environment: "Çevre bilimleri",
};

export type ConceptKind = "entity" | "process" | "property" | "quantity";

export interface Concept {
  id: string;
  domain: Domain;
  labelTr: string;
  /** Anlatım metninde bu kavramı yakalamak için yüzey biçimleri (küçük harf). */
  aliases: string[];
  kind: ConceptKind;
  descriptionTr: string;
  /** Şema diyagramında kullanılacak kısa etiket. */
  diagramLabel: string;
}

export type Certainty = "established" | "strong" | "hypothesis";

export interface SourceRef {
  id: string;
  title: string;
  publisher: string;
  url: string;
  kind: "institution" | "university" | "encyclopedia" | "paper" | "agency";
  noteTr?: string;
}

export interface Fact {
  id: string;
  textTr: string;
  concepts: string[];
  sourceIds: string[];
  certainty: Certainty;
}

export interface MechanismStep {
  id: string;
  /** Sahnenin Türkçe anlatımı (senaryo) — bilimsel/ayrıntılı sürüm. */
  narration: string;
  /**
   * Aynı adımın SADE anlatımı (hedef kitle dili). Varsa "sade" dil düzeyinde
   * doğrudan bu kullanılır; yoksa narration otomatik sadeleştirilir.
   * Bilimsel içerik aynıdır: yalnızca dil sadeleşir.
   */
  narrationSimple?: string;
  /** Sade dil düzeyinde ekranda görünen kısa başlık (jargonsuz, en fazla birkaç kelime). */
  overlaySimple?: string;
  /** Bu sahnenin anlatmak zorunda olduğu kavramlar. */
  concepts: string[];
  /** Görsel bileşen seçiminde kullanılan mekanizma kimliği. */
  mechanism: string;
  /** Görsel bileşene geçen parametreler (etiketler dâhil). */
  params?: Record<string, string | number | boolean | string[]>;
  overlay?: string;
  /** Süre kısıtlıysa atlanabilecek sahne. */
  optional?: boolean;
  /** Bu sahnenin anlaşılması için gereken en kısa süre (sn). */
  minDuration?: number;
}

export interface Misconception {
  /** Yanlış iddia (anlatımda geçmemeli). */
  claim: string;
  /** Doğrusu. */
  correction: string;
}

export interface KnowledgeCard {
  id: string;
  topicTitleTr: string;
  /** Konu eşleştirme anahtarları (küçük harf, Türkçe + İngilizce). */
  aliases: string[];
  domains: Domain[];
  summaryTr: string;
  concepts: string[];
  steps: MechanismStep[];
  facts: Fact[];
  sources: SourceRef[];
  /** Bu konuda asla gösterilmemesi gereken kavramlar. */
  forbiddenConcepts: string[];
  misconceptions: Misconception[];
  /** Konunun doğal sahne sayısı; süre hedefi bunun üzerinden ölçeklenir. */
  naturalDurationSec: number;
}

/** Kullanıcıya gösterilen araştırma özeti. */
export interface ResearchSummary {
  topic: string;
  cardId: string;
  titleTr: string;
  domains: Domain[];
  domainLabels: string[];
  summaryTr: string;
  conceptLabels: string[];
  facts: Fact[];
  sources: SourceRef[];
  misconceptions: Misconception[];
  /** Araştırma modu: hangi bilgi kaynağı kullanıldı. */
  mode: "curated-kb" | "curated-kb+llm";
  notes: string[];
  confidence: number;
}
