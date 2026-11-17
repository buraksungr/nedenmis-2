/**
 * Nedenmiş — senaryo dili.
 *
 * Editoryal ilke: "Karmaşık şeyleri, bilimsel olarak yanlış yapmadan, sade bir
 * dille anlat." Bu modül iki iş yapar:
 *
 *  1) simplifyNarration(): kartlardaki bilimsel anlatımı günlük Türkçeye çevirir.
 *     Bilgiyi değiştirmez; yalnızca terimi ve cümle yapısını sadeleştirir.
 *  2) evaluateScript(): senaryoyu ölçer (cümle uzunluğu, terim yoğunluğu,
 *     kanca, tekrar) ve "sade mi?" sorusuna sayısal cevap verir.
 *
 * İçerideki bilimsel kesinlik korunur: kartlar (knowledge card) ve görsel
 * doğrulama bilimsel terimlerle çalışmaya devam eder. Yalnızca İZLEYİCİYE giden
 * metin sadeleşir.
 */

export type LanguageLevel = "simple" | "standard" | "detailed";

export const LANGUAGE_LEVELS: { id: LanguageLevel; labelTr: string; descriptionTr: string }[] = [
  { id: "simple", labelTr: "Sade", descriptionTr: "Günlük konuşma dili; teknik terim yok. Varsayılan." },
  { id: "standard", labelTr: "Standart", descriptionTr: "Terim gerekli olduğunda bir kez geçer, hemen açıklanır." },
  { id: "detailed", labelTr: "Ayrıntılı", descriptionTr: "Daha fazla ayrıntı; yine de ders anlatımı değil." },
];

/**
 * Terim → günlük karşılık. Anahtar ifadeler büyük/küçük harf duyarsız aranır,
 * uzun ifadeler önce denenir (ör. "dörtyüzlü kristal örgü" tek parça).
 * Sağ taraf bilimsel olarak yanlış olmamalı; sadece daha anlaşılır olmalı.
 */
const TERM_REWRITES: [RegExp, string][] = [
  [/\bkristal (örgü|kafes)(si|sü|ye|de|den)?\b/gi, "atom düzeni"],
  [/\börgü(sü|sünü|ye)?\b/gi, "düzen"],
  [/\b(güçlü\s+)?kovalent\b/gi, "çok güçlü"],
  [/\btetrahedral\b/gi, "özel bir"],
  [/\bdörtyüzlü\b/gi, "özel"],
  [/\bdilimlenme düzlem(leri|i|inde|ine|ini)?\b/gi, "belirli bir zayıf düzlem"],
  [/\btokluk\b/gi, "darbeye dayanma"],
  [/\bgevreklik\b/gi, "kırılganlık"],
  [/\bgevrek(tir|tir)?\b/gi, "kırılgandır"],
  [/\bMohs (sertlik )?ölçe(ği|ğinde|ğinin)\b/gi, "sertlik sıralaması"],
  [/\bRayleigh saçılması\b/gi, "havadaki moleküllerin ışığı dağıtması"],
  [/\bsaçılma(sı|sına|yı)?\b/gi, "dağılma"],
  [/\bkısa dalga boy(u|lu|ları)\b/gi, "kısa dalgalı mavi ışık"],
  [/\buzun dalga boy(u|lu|ları)\b/gi, "uzun dalgalı kırmızı ışık"],
  [/\belektromanyetik tayf\b/gi, "ışık renkleri"],
  [/\bolay ufku\b/gi, "geri dönüşü olmayan sınır"],
  [/\btekillik\b/gi, "merkezdeki aşırı yoğun nokta"],
  [/\bkütleçekim(i|sel|sel çöküş)?\b/gi, "çekim gücü"],
  [/\bivme kazandırır\b/gi, "hızlandırır"],
  [/\belektron taşıma zinciri\b/gi, "enerji aktarma zinciri"],
  [/\bproton (gradyanı|gradyantı)\b/gi, "proton birikimi"],
  [/\bATP sentez(i|leyen)?\b/gi, "enerji üretimi"],
  [/\bkrista(lar)?\b/gi, "iç kıvrımlar"],
  [/\borganel(lar|in)?\b/gi, "hücrenin küçük birimi"],
  [/\bmitokondri(yal)?\b/gi, "hücrenin enerji santrali"],
  [/\boksidatif fosforilasyon\b/gi, "hücrenin enerji üretimi"],
  [/\bglikoz\b/gi, "şeker"],
  [/\biyon(lar|ları|laşma)?\b/gi, "yüklü parçacıklar"],
  [/\banyon(lar|ları)?\b/gi, "negatif yüklü parçacıklar"],
  [/\bkatyon(lar|ları)?\b/gi, "pozitif yüklü parçacıklar"],
  [/\belektron denizi\b/gi, "serbest dolaşan elektronlar"],
  [/\biletkenlik\b/gi, "elektriği iletme"],
  [/\bdirenç\b/gi, "zorluk"],
  [/\bçözünmüş (tuzlar|mineraller)\b/gi, "çözünmüş tuzlar"],
  [/\bhidrolojik döngü\b/gi, "suyun döngüsü"],
  [/\berozyon\b/gi, "aşınma"],
  [/\bsediment(ler|lerin)?\b/gi, "biriken tortular"],
  [/\btektonik\b/gi, "yer kabuğunun hareketi"],
];

/** Sadeleştirmede atılan, anlam taşımayan kalıplar. */
const FILLERS: RegExp[] = [
  /\bsöz konusu\b/gi,
  /\bbilindiği üzere\b/gi,
  /\bbilimsel olarak\b/gi,
  /\bşeklinde ifade edil(ir|ebilir)\b/gi,
  /\bolarak adlandırıl(ır|an)\b/gi,
];

/** Parantez içi açıklamalar ("(tetrahedral)") sade dilde okunmaz; çıkarılır. */
const PARENTHETICAL = /\s*\([^)]{0,40}\)/g;

export function normalizeLevel(level?: string | null): LanguageLevel {
  const raw = (level ?? "").trim().toLocaleLowerCase("tr-TR");
  if (raw === "standard" || raw === "standart" || raw === "normal") return "standard";
  if (raw === "detailed" || raw === "ayrıntılı" || raw === "ayrintili" || raw === "detaylı") return "detailed";
  // Bilinmeyen/boş değer her zaman güvenli varsayılana düşer.
  return "simple";
}

function applyTerms(text: string): string {
  let out = text;
  for (const [pattern, replacement] of TERM_REWRITES) out = out.replace(pattern, replacement);
  return out;
}

/**
 * Uzun cümleleri konuşma diline yakın parçalara böler. Virgülle bağlanmış
 * uzun cümlelerde ("…, bu yüzden …") ikinci parçayı ayrı cümle yapar.
 */
function splitLongSentences(text: string, maxWords = 14): string {
  // Noktalı virgül = cümle sınırı; ardından bağlaçlarla böl.
  const prepared = text.replace(/\s*;\s*/g, ". ");
  const rawSentences = prepared
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const connectors = /(?<=[,.]\s)|(?<=\s)(?=ancak\s|ama\s|fakat\s|çünkü\s|bu yüzden\s|bu nedenle\s|yani\s|üstelik\s)/i;
  const out: string[] = [];

  for (const sentence of rawSentences) {
    if (sentence.split(/\s+/).length <= maxWords) {
      out.push(sentence);
      continue;
    }
    const pieces = sentence
      .split(/,\s*(?=(?:ancak|ama|fakat|çünkü|bu yüzden|bu nedenle|yani|üstelik)\b)/i)
      .flatMap((piece) => piece.split(/\s+(?=(?:ancak|ama|fakat|çünkü)\b)/i))
      .map((piece) => piece.replace(/^[,.;]\s*/, "").trim())
      .filter(Boolean);

    let buffer = "";
    for (const piece of pieces) {
      const candidate = buffer ? `${buffer} ${piece}` : piece;
      if (candidate.split(/\s+/).length > maxWords && buffer) {
        out.push(buffer);
        buffer = piece;
      } else {
        buffer = candidate;
      }
    }
    if (buffer) out.push(buffer);
  }

  const capitalized = out.map((sentence) => {
    const t = sentence.trim();
    if (!t) return t;
    return t.charAt(0).toLocaleUpperCase("tr-TR") + t.slice(1);
  });
  return capitalized.join(" ").replace(/\s+([.,!?])/g, "$1");
}

function ensureSentenceEnd(text: string): string {
  const t = text.trim();
  if (!t) return t;
  if (/[.!?…]$/.test(t)) return t;
  // Bağlaçla başlayan parçalar büyük harfle başlasın.
  return `${t}.`.replace(/\.\.$/, ".");
}

/**
 * Anlatımı istenen dil düzeyine getirir.
 *  - detailed: metne dokunmaz.
 *  - standard: yalnızca terimleri sadeleştirir.
 *  - simple  : terimler + parantezler + uzun cümleler.
 */
export function simplifyNarration(text: string, level: LanguageLevel = "simple"): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return clean;
  if (level === "detailed") return clean;

  let out = applyTerms(clean);
  if (level === "simple") {
    out = out.replace(PARENTHETICAL, "");
    for (const filler of FILLERS) out = out.replace(filler, "");
    out = splitLongSentences(out);
  }
  return out
    .replace(/\b(çok güçlü)(\s+\1)+\b/gi, "$1")
    .replace(/\b(özel)(\s+bir)?(\s+\1\b)+/gi, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

// ---------------------------------------------------------------------------
// Senaryo kalite ölçümü
// ---------------------------------------------------------------------------

export type ScriptQualityIssue = {
  code: string;
  severity: "error" | "warning";
  messageTr: string;
  sample?: string;
};

export type ScriptQuality = {
  level: LanguageLevel;
  score: number;
  ok: boolean;
  sentenceCount: number;
  avgWordsPerSentence: number;
  longestSentenceWords: number;
  longSentenceRatio: number;
  technicalTerms: { term: string; count: number }[];
  technicalTermCount: number;
  words: number;
  estimatedSec: number;
  hook: { ok: boolean; sample: string };
  issues: ScriptQualityIssue[];
};

/** Değerlendiricide "teknik terim" sayılan kalıplar (sade dilde olmamalı). */
const TECH_TERMS: RegExp[] = [
  /\bkovalent\b/gi,
  /\bdörtyüzlü\b/gi,
  /\bkristal örgü\b/gi,
  /\bdilimlenme\b/gi,
  /\btokluk\b/gi,
  /\bgevreklik\b/gi,
  /\bRayleigh\b/gi,
  /\belektromanyetik\b/gi,
  /\bolay ufku\b/gi,
  /\btekillik\b/gi,
  /\bgradyan\b/gi,
  /\bfosforilasyon\b/gi,
  /\boksidatif\b/gi,
  /\banyon\b/gi,
  /\bkatyon\b/gi,
  /\bentalpi\b/gi,
  /\bentropi\b/gi,
  /\bvektör(el)?\b/gi,
  /\bparametre\b/gi,
  /\bhipotez\b/gi,
  /\bparadigma\b/gi,
  /\bmekanizma\b/gi,
];

const HOOK_PATTERNS = [/neden/i, /nasıl/i, /peki/i, /biliyor muydunuz/i, /hiç düşündünüz mü/i, /\?/];

export function evaluateScript(text: string, level: LanguageLevel = "simple"): ScriptQuality {
  const clean = text.replace(/\s+/g, " ").trim();
  const sentences = clean
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const words = clean.split(/\s+/).filter(Boolean);
  const sentenceWordCounts = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const longest = sentenceWordCounts.length ? Math.max(...sentenceWordCounts) : 0;
  const longSentences = sentenceWordCounts.filter((n) => n > 18).length;
  const longRatio = sentences.length ? Math.round((longSentences / sentences.length) * 100) / 100 : 0;
  const avg = sentenceWordCounts.length
    ? Math.round((sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length) * 10) / 10
    : 0;

  const technicalTerms: { term: string; count: number }[] = [];
  for (const pattern of TECH_TERMS) {
    const matches = clean.match(pattern);
    if (matches?.length) technicalTerms.push({ term: matches[0].toLowerCase(), count: matches.length });
  }
  const technicalTermCount = technicalTerms.reduce((a, b) => a + b.count, 0);

  const firstSentence = sentences[0] ?? "";
  const opening = sentences.slice(0, 2).join(" ");
  // Kanca ilk iki cümlede aranır: "X en sert maddedir. Peki neden kırılır?" tipik kalıptır.
  const hook = {
    ok: HOOK_PATTERNS.some((p) => p.test(firstSentence) || p.test(opening)),
    sample: firstSentence.slice(0, 120),
  };

  const issues: ScriptQualityIssue[] = [];
  const limits = level === "detailed" ? { avg: 22, long: 0.5, terms: 12 } : level === "standard" ? { avg: 17, long: 0.3, terms: 6 } : { avg: 14, long: 0.15, terms: 2 };

  if (avg > limits.avg) {
    issues.push({
      code: "SENTENCES_TOO_LONG",
      severity: level === "simple" ? "error" : "warning",
      messageTr: `Cümleler ortalama ${avg} kelime; ${level === "simple" ? "sade dil" : "bu düzey"} için en fazla ${limits.avg} olmalı.`,
    });
  }
  if (longRatio > limits.long) {
    issues.push({
      code: "LONG_SENTENCE_RATIO",
      severity: level === "simple" ? "error" : "warning",
      messageTr: `Cümlelerin %${Math.round(longRatio * 100)}'i 18 kelimeden uzun (sınır %${Math.round(limits.long * 100)}).`,
    });
  }
  if (technicalTermCount > limits.terms) {
    issues.push({
      code: "TOO_TECHNICAL",
      severity: level === "simple" ? "error" : "warning",
      messageTr: `Metinde ${technicalTermCount} teknik terim var (${technicalTerms
        .slice(0, 5)
        .map((t) => t.term)
        .join(", ")}). Sade dilde en fazla ${limits.terms} olmalı.`,
    });
  }
  if (!hook.ok) {
    issues.push({ code: "WEAK_HOOK", severity: "warning", messageTr: "Açılış cümlesi merak uyandırmıyor (soru/şaşırtıcı bilgi yok)." });
  }
  if (words.length < 25) {
    issues.push({ code: "TOO_SHORT", severity: "warning", messageTr: "Senaryo çok kısa; izleyiciye yeterli açıklama verilmiyor olabilir." });
  }

  const penalty =
    Math.max(0, avg - limits.avg) * 2.5 +
    Math.max(0, longRatio - limits.long) * 40 +
    Math.max(0, technicalTermCount - limits.terms) * 4 +
    (hook.ok ? 0 : 8);
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  return {
    level,
    score,
    ok: issues.every((i) => i.severity !== "error"),
    sentenceCount: sentences.length,
    avgWordsPerSentence: avg,
    longestSentenceWords: longest,
    longSentenceRatio: longRatio,
    technicalTerms,
    technicalTermCount,
    words: words.length,
    estimatedSec: Math.round((words.length / 2.35) * 10) / 10,
    hook,
    issues,
  };
}

/** Değerlendirme başarısızsa metni yeniden sadeleştirir (en fazla 2 geçiş). */
export function ensureSimple(text: string, level: LanguageLevel = "simple"): { text: string; quality: ScriptQuality; passes: number } {
  let current = text;
  let quality = evaluateScript(current, level);
  let passes = 0;
  while (!quality.ok && passes < 2) {
    current = simplifyNarration(current, level === "detailed" ? "standard" : "simple");
    quality = evaluateScript(current, level);
    passes++;
  }
  return { text: current, quality, passes };
}
