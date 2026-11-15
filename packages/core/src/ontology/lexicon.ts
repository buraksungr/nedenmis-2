/** Türkçe metin normalizasyonu ve eşleştirme yardımcıları. */

export function normalizeTr(text: string): string {
  return text
    .toLocaleLowerCase("tr")
    .replace(/[’'`´]/g, "")
    .replace(/[^\p{L}\p{N}\s%+]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SUFFIXES = [
  "larında", "lerinde", "larındaki", "lerindeki", "ndaki", "ndeki", "daki", "deki",
  "larının", "lerinin", "sının", "sinin", "nun", "nün", "ının", "inin", "unun", "ünün",
  "ların", "lerin", "sini", "sını", "nı", "ni", "nu", "nü", "sı", "si", "su", "sü",
  "ları", "leri", "lar", "ler", "ın", "in", "un", "ün", "ya", "ye", "yı", "yi",
  "dan", "den", "tan", "ten", "da", "de", "ta", "te", "a", "e", "ı", "i", "u", "ü",
  "lık", "lik", "luk", "lük", "ca", "ce", "ki", "yla", "yle", "ndır", "ndir",
];

/** Basit Türkçe gövdeleme: yalnızca eşleştirme için; dilbilimsel iddiası yoktur. */
export function stemTr(token: string): string {
  let t = normalizeTr(token);
  if (t.length <= 3) return t;
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 3) {
    changed = false;
    for (const s of SUFFIXES) {
      if (t.length - s.length >= 3 && t.endsWith(s)) {
        t = t.slice(0, t.length - s.length);
        changed = true;
        break;
      }
    }
  }
  return t;
}

export function tokenize(text: string): string[] {
  return normalizeTr(text).split(" ").filter(Boolean);
}

export function stems(text: string): string[] {
  return tokenize(text).map(stemTr);
}

const STOP = new Set([
  "neden", "nasıl", "niçin", "nedir", "ne", "mi", "mı", "mu", "mü", "bir", "ve", "ile",
  "için", "çok", "daha", "en", "bu", "şu", "o", "da", "de", "ki", "ama", "fakat",
  "gibi", "kadar", "olan", "olur", "oluyor", "var", "yok", "her", "şey", "biz", "bizim",
  "siz", "onlar", "the", "why", "how", "does", "do", "is", "are", "a", "an", "of",
]);

export function contentStems(text: string): string[] {
  return stems(text).filter((s) => s.length >= 2 && !STOP.has(s));
}

/** Levenshtein tabanlı benzerlik (0–1). */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  if (!m || !n) return 0;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return 1 - dp[m][n] / Math.max(m, n);
}

/** 0–1 arası bulanık benzerlik; ek toleransı için gövdeler üzerinde çalışır. */
export function fuzzyTokenMatch(a: string, b: string): number {
  const sa = stemTr(a);
  const sb = stemTr(b);
  if (sa === sb) return 1;
  if (sa.length >= 4 && sb.length >= 4 && (sa.startsWith(sb) || sb.startsWith(sa))) return 0.9;
  const sim = similarity(sa, sb);
  return sim >= 0.8 ? sim : 0;
}

/**
 * Görsel etiketlerde kullanılması yasak olan, bilimsel olarak ilgisiz
 * kavram aileleri. Doğrulayıcı bunları bağlama göre reddeder.
 */
export const CONCEPT_FAMILIES: Record<string, string[]> = {
  biology: [
    "hücre", "hücrenin", "zar", "organel", "mitokondri", "krista", "kloroplast", "klorofil",
    "nöron", "sinaps", "nörotransmitter", "dna", "ribozom", "çekirdekçik", "atp sentaz",
    "glikoz", "enzim", "protein", "bakteri", "doku",
  ],
  materials: [
    "kristal", "örgü", "kafes", "kovalent bağ", "dilimlenme", "sertlik", "gevreklik",
    "çatlak", "atom", "elmas", "grafit", "molibden", "safir",
  ],
  astronomy: [
    "kara delik", "olay ufku", "yığılma diski", "uzay-zaman", "mercekleme", "yıldız",
    "galaksi", "yörünge", "gezegen", "ışık yılı", "tekillik",
  ],
  geology: [
    "levha", "fay", "manto", "sismik", "deprem", "magma", "volkan", "kayaç", "mineral",
    "aşınma", "tortul",
  ],
  optics: [
    "dalga boyu", "saçılma", "tayf", "foton", "prizma", "gökkuşağı", "kırılma", "yansıma",
    "rayleigh", "atmosfer",
  ],
  electricity: [
    "elektron", "iyon", "gerilim", "akım", "direnç", "iletken", "yalıtkan", "elektrik alanı",
    "pil", "devre",
  ],
};

/** Bir etiket metninin hangi kavram ailelerine dokunduğunu döndürür. */
export function detectFamilies(text: string): string[] {
  const norm = ` ${normalizeTr(text)} `;
  const out: string[] = [];
  for (const [family, terms] of Object.entries(CONCEPT_FAMILIES)) {
    if (terms.some((term) => norm.includes(` ${term} `) || norm.includes(` ${term}s`))) out.push(family);
  }
  return out;
}
