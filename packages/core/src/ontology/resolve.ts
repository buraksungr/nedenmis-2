import { CARDS_A } from "./cards-a.js";
import { CARDS_B } from "./cards-b.js";
import { CONCEPTS, conceptLabels } from "./concepts.js";
import { contentStems, fuzzyTokenMatch, normalizeTr } from "./lexicon.js";
import type { Domain, KnowledgeCard, ResearchSummary } from "./types.js";
import { DOMAIN_TR } from "./types.js";

export const KNOWLEDGE_CARDS: KnowledgeCard[] = [...CARDS_A, ...CARDS_B];

const CARD_INDEX = new Map(KNOWLEDGE_CARDS.map((c) => [c.id, c]));

export function getCard(id: string): KnowledgeCard | undefined {
  return CARD_INDEX.get(id);
}

export type Resolution = {
  card: KnowledgeCard | null;
  confidence: number;
  reason: string;
  alternatives: { id: string; titleTr: string; score: number }[];
};

function scoreAlias(alias: string, card: KnowledgeCard, topicNorm: string, topicStems: string[]): number {
  const aliasNorm = normalizeTr(alias);
  const aliasStems = contentStems(alias);
  let score = 0;

  if (aliasNorm.length >= 4 && topicNorm.includes(aliasNorm)) {
    // Uzun ve tam ifade eşleşmesi en güvenilir sinyaldir.
    score += 0.55 + Math.min(0.35, aliasNorm.length / 60);
  } else if (aliasStems.length > 0) {
    const matches = aliasStems.filter((as) => topicStems.some((ts) => fuzzyTokenMatch(as, ts) >= 0.8));
    if (matches.length === aliasStems.length) score += 0.4;
    else if (matches.length > 0) score += 0.28 * (matches.length / aliasStems.length);
  }

  // Kartın kendi başlığındaki ayırt edici kelimeler de eşleşme sayılır.
  const titleStems = contentStems(card.topicTitleTr);
  const titleHits = titleStems.filter((ts) => topicStems.some((q) => fuzzyTokenMatch(ts, q) >= 0.85));
  if (titleStems.length) score += 0.25 * (titleHits.length / titleStems.length);

  return score;
}

/** Konuyu bilgi kartıyla eşleştirir. Eşleşme yoksa null döner (uydurma yok). */
export function resolveTopic(topic: string): Resolution {
  const topicNorm = normalizeTr(topic);
  const topicStems = contentStems(topic);
  const ranked = KNOWLEDGE_CARDS.map((card) => {
    let best = 0;
    for (const alias of card.aliases) {
      best = Math.max(best, scoreAlias(alias, card, topicNorm, topicStems));
    }
    // Domain sözcükleri zayıf bir destek sinyali verir.
    const domainHint = card.domains.some((d) => topicNorm.includes(DOMAIN_TR[d].toLocaleLowerCase("tr").split(" ")[0]));
    if (domainHint) best += 0.05;
    return { card, score: Math.min(1, best) };
  }).sort((a, b) => b.score - a.score);

  const top = ranked[0];
  const alternatives = ranked.slice(0, 3).map((r) => ({ id: r.card.id, titleTr: r.card.topicTitleTr, score: Number(r.score.toFixed(3)) }));

  if (!top || top.score < 0.34) {
    return {
      card: null,
      confidence: top?.score ?? 0,
      reason:
        "Bu konu için doğrulanmış bilimsel bilgi kartı bulunamadı. Nedenmiş Studio, bilimsel olarak doğrulanmamış görseller üretmemek için bu konuyu şu anda işlemiyor.",
      alternatives,
    };
  }
  // İki kart birbirine çok yakınsa belirsizlik vardır; yanlış konuya görsel üretmek yerine reddet.
  if (ranked[1] && ranked[0].score - ranked[1].score < 0.05 && ranked[1].score >= 0.34) {
    return {
      card: null,
      confidence: ranked[0].score,
      reason:
        "Konu birden fazla bilgi kartıyla neredeyse eşit ölçüde eşleşti. Yanlış görsel üretmemek için konuyu biraz daha belirgin yazın.",
      alternatives,
    };
  }
  return { card: top.card, confidence: top.score, reason: "Bilgi kartı eşleşti.", alternatives };
}

export function buildResearchSummary(card: KnowledgeCard, topic: string, confidence: number, mode: "curated-kb" | "curated-kb+llm" = "curated-kb"): ResearchSummary {
  const notes = [
    "Bilimsel özet, yerleşik kaynaklara dayanan elle doğrulanmış bilgi kartından üretildi.",
    "Görseller yalnızca bu özetin kavramlarından planlanır; kart dışı kavramlar doğrulamada reddedilir.",
  ];
  if (!card.sources.every((s) => s.url.startsWith("https://"))) {
    notes.push("Bazı kaynak bağlantıları http üzerinden yayınlanmaktadır.");
  }
  notes.push("Uygulama bu üretimde internetten canlı yayın çekmedi; kaynaklar referans olarak listelenmiştir.");
  return {
    topic,
    cardId: card.id,
    titleTr: card.topicTitleTr,
    domains: card.domains,
    domainLabels: card.domains.map((d: Domain) => DOMAIN_TR[d]),
    summaryTr: card.summaryTr,
    conceptLabels: conceptLabels(card.concepts),
    facts: card.facts,
    sources: card.sources,
    misconceptions: card.misconceptions,
    mode,
    notes,
    confidence,
  };
}

/** Konu önerileri (arayüzdeki örnek butonlar). */
export function suggestedTopics(): { topic: string; cardId: string }[] {
  return KNOWLEDGE_CARDS.map((c) => ({ topic: c.topicTitleTr, cardId: c.id }));
}

export function conceptCoverage(card: KnowledgeCard): number {
  const declared = card.concepts.filter((id) => CONCEPTS[id]);
  return declared.length / Math.max(1, card.concepts.length);
}
