/**
 * Görsel stil referansından (image-1.png) türetilen palet.
 * Referans ölçümü: sıcak okre/toprak baskın (%86 sıcak piksel), üst bantda açık mavimsi gökyüzü,
 * kalın mürekkep konturlar (güçlü kenar oranı ~%25), dokulu yüzey.
 */
export const C = {
  ink: "#2b1a0c", // mürekkep / kontur
  inkDeep: "#1d1106",
  soilDark: "#3a2410",
  soil: "#6b4423",
  soilLight: "#8a6230",
  ochre: "#a88838",
  gold: "#d8c858",
  sand: "#e8dca0",
  cream: "#f4ecd6",
  paper: "#efe3c8",
  sky: "#cfe3e6",
  skyLight: "#e9f3f3",
  skyCold: "#b9cdd4",
  sage: "#9fb06a",
  snow: "#f7f9f6",
  antBody: "#3a2410",
  antMid: "#5a3a1a",
  antHi: "#8a6230",
  warmGlow: "#ffcf7a",
  coldGlow: "#bcd6e2",
} as const;

export const FONT_DISPLAY = "Archivo Black, 'Archivo', sans-serif";
export const FONT_TEXT = "Archivo, sans-serif";

/** Deterministik sözde rastgele üreteç (kare başına aynı değer). */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

export function mixHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const k = clamp01(t);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(clamp01(t) - 1, 3) + c1 * Math.pow(clamp01(t) - 1, 2);
};
