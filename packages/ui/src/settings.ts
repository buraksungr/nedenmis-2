// Stüdyo varsayılanları: genel izleyiciye yönelik Türkçe merak kanalı için seçilmiş değerler.
// Ayarlar tarayıcıda saklanır; "Video oluştur" ekranı bu varsayılanlarla açılır.

export type LanguageLevelId = "simple" | "standard" | "detailed";
export type QualityId = "draft" | "standard" | "high";
export type VisualComplexityId = "sade" | "dengeli" | "zengin";

export type StudioSettings = {
  /** Senaryo dil düzeyi — varsayılan her zaman "sade". */
  languageLevel: LanguageLevelId;
  targetDurationSec: number;
  quality: QualityId;
  engine: string;
  voice: string;
  rate: number;
  chatterboxUrl: string;
  subtitles: boolean;
  visualComplexity: VisualComplexityId;
  /** Dikey Shorts formatı; motor şu an yalnızca 9:16 üretiyor. */
  aspectRatio: "9:16";
};

export const DEFAULT_SETTINGS: StudioSettings = {
  languageLevel: "simple",
  targetDurationSec: 30,
  quality: "high",
  engine: "espeak",
  voice: "tr",
  rate: 165,
  chatterboxUrl: "http://127.0.0.1:4321",
  subtitles: true,
  visualComplexity: "sade",
  aspectRatio: "9:16",
};

export const LANGUAGE_LEVEL_INFO: { id: LanguageLevelId; label: string; desc: string }[] = [
  { id: "simple", label: "Sade", desc: "Kısa cümleler, jargon yok. Genel izleyici için varsayılan." },
  { id: "standard", label: "Standart", desc: "Terimler kısaca açıklanır; tempo biraz daha yoğun." },
  { id: "detailed", label: "Ayrıntılı", desc: "Daha fazla mekanizma ayrıntısı; yine de ders anlatımı değil." },
];

const KEY = "nedenmis.settings.v1";

export function loadSettings(): StudioSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<StudioSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(next: StudioSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* depolama kapalıysa sessizce geç */
  }
}

/** Son açılan proje — menüdeki "Stüdyo" bağlantısı için. */
const LAST_KEY = "nedenmis.lastProject";

export function rememberProject(id: string) {
  try {
    localStorage.setItem(LAST_KEY, id);
  } catch {
    /* yoksay */
  }
}

export function lastProject(): string | null {
  try {
    return localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}
