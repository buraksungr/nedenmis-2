import { arrow, chip, circle, clamp, dot, easeInOut, easeOut, glow, label, n, panel, pulse, rand, seg } from "../primitives.js";
import type { VisualComponent } from "./types.js";
import { str } from "./types.js";

const CX = 540;

export const gravityVectors: VisualComponent = {
  id: "gravity_vectors",
  labelTr: "Kütle çekim vektörleri",
  domains: ["physics", "astronomy"],
  mechanisms: ["gravity_vectors"],
  concepts: ["mass", "gravitational_force", "force", "acceleration", "energy"],
  incompatibleConcepts: ["cell", "mitochondrion", "covalent_bond", "tectonic_plate", "chloride_ion"],
  scientificNote:
    "Newton'ın evrensel çekim yasası: F = G·m₁·m₂/r². Kuvvet her iki cisme eşit büyüklükte, zıt yönde etki eder; uzaklık iki katına çıkarsa kuvvet dörtte bire iner.",
  params: [
    { name: "massLabel", type: "string", default: "kütle", desc: "Kütle etiketi" },
    { name: "forceLabel", type: "string", default: "çekim kuvveti", desc: "Kuvvet etiketi" },
    { name: "distanceLabel", type: "string", default: "uzaklık", desc: "Uzaklık etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const massLabel = str(params, "massLabel", "kütle");
    const forceLabel = str(params, "forceLabel", "çekim kuvveti");
    const distanceLabel = str(params, "distanceLabel", "uzaklık");
    const sep = 380 + Math.sin(t * 0.5) * 20;
    const m1 = { x: CX - sep / 2, y: 820 };
    const m2 = { x: CX + sep / 2, y: 820 };
    const strength = 200 - (sep - 360) * 0.4;
    return `
      ${label(CX, 470, "HER KÜTLE DİĞERİNİ ÇEKER", { size: 27, fill: pal.muted, letterSpacing: 3 })}
      ${glow(m1.x, m1.y, 170, pal.accent, 0.22)}
      ${circle(m1.x, m1.y, 92, { fill: "rgba(90,210,255,0.25)", stroke: pal.accent, strokeWidth: 3 })}
      ${label(m1.x, m1.y + 10, "m₁", { size: 40, fill: pal.ink })}
      ${glow(m2.x, m2.y, 120, pal.accent2, 0.2)}
      ${circle(m2.x, m2.y, 62, { fill: "rgba(255,209,102,0.22)", stroke: pal.accent2, strokeWidth: 3 })}
      ${label(m2.x, m2.y + 10, "m₂", { size: 32, fill: pal.ink })}
      ${arrow(m1.x + 100, m1.y - 60, m1.x + 100 + strength * 0.9, m1.y - 60, { color: pal.accent2, width: 4 })}
      ${arrow(m2.x - 70, m2.y + 70, m2.x - 70 - strength * 0.9, m2.y + 70, { color: pal.accent, width: 4 })}
      ${label((m1.x + m2.x) / 2, 1030, distanceLabel, { size: 24, fill: pal.muted })}
      ${`<line x1="${m1.x}" y1="1040" x2="${m2.x}" y2="1040" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-dasharray="6 8"/>`}
      ${chip((m1.x + m2.x) / 2, 740, forceLabel, { color: pal.ink, size: 23, fill: "rgba(8,18,28,0.8)" })}
      ${label(CX, 1140, "F = G · m₁ · m₂ / r²", { size: 38, fill: pal.accent2, weight: 700 })}
      ${label(CX, 1240, "Uzaklık iki katına çıkarsa kuvvet dörtte bire iner", { size: 24, fill: pal.muted })}
      ${label(CX, 1320, "Kuvvetler eşit büyüklükte, zıt yöndedir", { size: 23, fill: pal.muted, opacity: 0.85 })}
    `;
  },
};

export const freeFall: VisualComponent = {
  id: "free_fall",
  labelTr: "Serbest düşme (hava direnci yok)",
  domains: ["physics"],
  mechanisms: ["free_fall"],
  concepts: ["free_fall", "acceleration", "mass", "gravitational_force", "force"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "tectonic_plate"],
  scientificNote:
    "Hava direnci yoksayılırsa tüm cisimler aynı ivmeyle düşer: g ≈ 9,81 m/s². Kütle düşme hızını değiştirmez; hava direnci devreye girdiğinde fark oluşur.",
  params: [
    { name: "heavyLabel", type: "string", default: "ağır cisim", desc: "Ağır cisim" },
    { name: "lightLabel", type: "string", default: "hafif cisim", desc: "Hafif cisim" },
    { name: "gLabel", type: "string", default: "g ≈ 9,8 m/s²", desc: "g etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const heavyLabel = str(params, "heavyLabel", "ağır cisim");
    const lightLabel = str(params, "lightLabel", "hafif cisim");
    const gLabel = str(params, "gLabel", "g ≈ 9,8 m/s²");
    const startY = 560;
    const floorY = 1220;
    const cycle = 3.2;
    const p = (t % cycle) / cycle;
    const fall = Math.min(1, p / 0.62);
    const y = startY + (floorY - startY) * fall * fall;
    const reset = p > 0.86 ? 1 - seg(p, 0.86, 1) : 1;
    const drawBall = (x: number, r: number, color: string, labelText: string) => `
      ${dot(x, y, r * reset, color, 0.95)}
      ${glow(x, y, r * 2.4, color, 0.18 * reset)}
      ${label(x, y + 240, labelText, { size: 23, fill: pal.muted, opacity: reset })}
    `;
    return `
      <line x1="120" y1="${floorY + 40}" x2="960" y2="${floorY + 40}" stroke="rgba(255,255,255,0.18)" stroke-width="3"/>
      <rect x="100" y="${startY - 90}" width="880" height="${floorY - startY + 170}" rx="30" fill="rgba(8,18,30,0.35)" stroke="rgba(255,255,255,0.06)"/>
      <line x1="540" y1="${startY - 80}" x2="540" y2="${floorY + 20}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4 10"/>
      ${drawBall(400, 44, "#8fd8ff", heavyLabel)}
      ${drawBall(680, 26, "#ffd166", lightLabel)}
      ${arrow(870, startY, 870, startY + 190, { color: pal.accent2, width: 3.5, opacity: 0.7 })}
      ${label(870, startY + 240, gLabel, { size: 24, fill: pal.accent2 })}
      ${label(870, startY - 30, "yer çekimi", { size: 22, fill: pal.muted })}
      ${label(CX, 1330, "Kütle ivmeyi değiştirmez; hava direnci değiştirir", { size: 24, fill: pal.muted })}
      ${label(CX, 1410, "Vakumda tüy ve demir bilye aynı anda düşer", { size: 23, fill: pal.muted, opacity: 0.8 })}
    `;
  },
};

export const orbitFall: VisualComponent = {
  id: "orbit_fall",
  labelTr: "Yörünge: sürekli düşme",
  domains: ["physics", "astronomy"],
  mechanisms: ["orbit_fall"],
  concepts: ["free_fall", "gravitational_force", "energy", "acceleration", "mass", "spacetime_curvature"],
  incompatibleConcepts: ["cell", "mitochondrion", "covalent_bond", "tectonic_plate"],
  scientificNote:
    "Yörüngedeki cisim sürekli serbest düşer; yeterli yatay hız sayesinde Dünya yüzeyini ıskalar. Yörünge, düşme ile yatay hareketin bileşimidir.",
  params: [
    { name: "earthLabel", type: "string", default: "Dünya", desc: "Dünya etiketi" },
    { name: "satelliteLabel", type: "string", default: "uydu", desc: "Uydu etiketi" },
    { name: "pathLabel", type: "string", default: "yörünge", desc: "Yörünge etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const earthLabel = str(params, "earthLabel", "Dünya");
    const satelliteLabel = str(params, "satelliteLabel", "uydu");
    const pathLabel = str(params, "pathLabel", "yörünge");
    const R = 230;
    const cy = 860;
    const a = t * 0.6;
    const sx = CX + Math.cos(a) * 380;
    const sy = cy + Math.sin(a) * 230;
    let trail = "";
    for (let i = 0; i < 26; i++) {
      const ta = a - i * 0.045;
      trail += dot(CX + Math.cos(ta) * 380, cy + Math.sin(ta) * 230, 3.2, pal.accent2, (1 - i / 26) * 0.5);
    }
    return `
      ${label(CX, 470, "YÖRÜNGE = SÜREKLİ DÜŞME", { size: 27, fill: pal.muted, letterSpacing: 3 })}
      <ellipse cx="${CX}" cy="${cy}" rx="380" ry="230" fill="none" stroke="${pal.accent}" stroke-width="1.5" opacity="0.25" stroke-dasharray="8 10"/>
      ${glow(CX, cy, 300, "#4aa3d8", 0.25)}
      <circle cx="${CX}" cy="${cy}" r="${R}" fill="#0c3a52" stroke="#3f8fb8" stroke-width="2"/>
      <circle cx="${CX}" cy="${cy}" r="${R}" fill="url(#sheen)" opacity="0.6"/>
      ${label(CX, cy + 12, earthLabel, { size: 32, fill: "#dff3ff", opacity: 0.85 })}
      ${trail}
      ${dot(sx, sy, 15, pal.accent2, 1)}
      ${glow(sx, sy, 46, pal.accent2, 0.3)}
      ${label(sx, sy - 42, satelliteLabel, { size: 23, fill: pal.accent2 })}
      ${arrow(sx, sy, CX + Math.cos(a) * (R + 30), cy + Math.sin(a) * (R + 30), { color: pal.accent, width: 3, opacity: 0.8 })}
      ${arrow(sx, sy, sx + Math.cos(a + Math.PI / 2) * 110, sy + Math.sin(a + Math.PI / 2) * 70, { color: "#ffffff", width: 3, opacity: 0.7 })}
      ${label(sx + 130, sy + 40, "yatay hız", { size: 21, fill: pal.ink, opacity: 0.7, anchor: "start" })}
      ${label(CX + 210, cy + 300, pathLabel, { size: 24, fill: pal.accent })}
      ${label(CX, 1260, "Yer çekimi uyduyu içeri çeker, hızı ıskalatır", { size: 24, fill: pal.muted })}
      ${label(CX, 1340, "Aynı ilke Ay ve gezegen yörüngelerinde geçerli", { size: 23, fill: pal.muted, opacity: 0.8 })}
    `;
  },
};
