import { arrow, chip, circle, clamp, dot, easeInOut, easeOut, glow, label, n, panel, pulse, rand, seg } from "../primitives.js";
import type { VisualComponent } from "./types.js";
import { str } from "./types.js";

const CX = 540;

function waterMolecule(x: number, y: number, r: number, angle: number, color: string, opacity = 0.9): string {
  const o = { x, y };
  const h1 = { x: x + Math.cos(angle - 0.9) * r, y: y + Math.sin(angle - 0.9) * r };
  const h2 = { x: x + Math.cos(angle + 0.9) * r, y: y + Math.sin(angle + 0.9) * r };
  return `<g opacity="${opacity}"><line x1="${n(o.x)}" y1="${n(o.y)}" x2="${n(h1.x)}" y2="${n(h1.y)}" stroke="${color}" stroke-width="2.4" opacity="0.8"/><line x1="${n(o.x)}" y1="${n(o.y)}" x2="${n(h2.x)}" y2="${n(h2.y)}" stroke="${color}" stroke-width="2.4" opacity="0.8"/>${dot(o.x, o.y, r * 0.42, color, 1)}${dot(h1.x, h1.y, r * 0.23, color, 0.9)}${dot(h2.x, h2.y, r * 0.23, color, 0.9)}</g>`;
}

export const rockWeathering: VisualComponent = {
  id: "rock_weathering",
  labelTr: "Kayaç ayrışması ve iyon salınımı",
  domains: ["geology", "earth", "chemistry"],
  mechanisms: ["rock_weathering"],
  concepts: ["rock_weathering", "water_cycle", "water", "sodium_ion", "chloride_ion", "carbon_dioxide"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "neuron"],
  scientificNote:
    "Yağmur suyu atmosferdeki CO₂ ile zayıf karbonik asit oluşturur; bu su mineralleri kimyasal ayrışmayla iyonlara ayırır. Fiziksel aşınma tek başına tuzu çözmez.",
  params: [
    { name: "rainLabel", type: "string", default: "asitli yağmur", desc: "Yağmur etiketi" },
    { name: "rockLabel", type: "string", default: "kayaç", desc: "Kaya etiketi" },
    { name: "ionLabel", type: "string", default: "çözünen iyonlar", desc: "İyon etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const rainLabel = str(params, "rainLabel", "asitli yağmur");
    const rockLabel = str(params, "rockLabel", "kayaç");
    const ionLabel = str(params, "ionLabel", "çözünen iyonlar");
    const rx = 400;
    const ryBase = 1240;
    let rain = "";
    for (let i = 0; i < 26; i++) {
      const p = ((t * 0.6 + rand(2, i)) % 1);
      const x = 110 + rand(4, i) * 700;
      const y = 540 + p * 620;
      rain += `<line x1="${n(x)}" y1="${n(y)}" x2="${n(x - 6)}" y2="${n(y + 30)}" stroke="#9fe4ff" stroke-width="2.8" opacity="${n(0.6 * (1 - p * 0.35))}"/>`;
    }
    let ions = "";
    for (let i = 0; i < 14; i++) {
      const p = ((t * 0.36 + rand(6, i)) % 1);
      const x = rx + 190 + p * 340 + rand(8, i) * 26;
      const y = 980 - p * 230 + Math.sin(t * 1.4 + i) * 16;
      const isNa = i % 2 === 0;
      ions += glow(x, y, 26, isNa ? "#ffd166" : "#5ad2ff", 0.25);
      ions += dot(x, y, 14, isNa ? "rgba(255,209,102,0.95)" : "rgba(90,210,255,0.95)", 1);
      ions += label(x, y + 5, isNa ? "Na⁺" : "Cl⁻", { size: 13, fill: "#0a1218", weight: 700, shadow: false });
    }
    const c02 = [];
    for (let i = 0; i < 3; i++) {
      const p = ((t * 0.4 + i / 3) % 1);
      c02.push(`<g opacity="${n(1 - p * 0.5)}">${dot(260 + i * 80, 660 + p * 90, 12, "#8fd8ff", 0.9)}${label(260 + i * 80, 665 + p * 90, "CO₂", { size: 11, fill: "#04121a", shadow: false, weight: 700 })}</g>`);
    }
    return `
      ${label(CX, 470, "YAĞMUR KAYAYI KİMYASAL OLARAK AYRIŞTIRIR", { size: 24, fill: pal.muted, letterSpacing: 1 })}
      ${rain}
      ${c02.join("")}
      ${chip(230, 560, rainLabel, { color: "#bde9ff", size: 23, fill: "rgba(8,22,32,0.85)" })}
      <polygon points="${rx - 230},${ryBase} ${rx - 120},${ryBase - 300} ${rx + 10},${ryBase - 360} ${rx + 180},${ryBase - 210} ${rx + 205},${ryBase}" fill="rgba(150,155,170,0.24)" stroke="rgba(220,225,240,0.55)" stroke-width="2.5"/>
      <polygon points="${rx - 80},${ryBase - 250} ${rx + 10},${ryBase - 320} ${rx + 90},${ryBase - 210} ${rx - 10},${ryBase - 160}" fill="rgba(255,209,102,0.12)" stroke="rgba(255,209,102,0.35)" stroke-width="1.5"/>
      <polyline points="${rx - 120},${ryBase - 300} ${rx - 40},${ryBase - 240} ${rx + 40},${ryBase - 250} ${rx + 120},${ryBase - 200}" fill="none" stroke="rgba(180,240,255,0.35)" stroke-width="6"/>
      ${label(rx - 40, ryBase + 60, rockLabel, { size: 24, fill: pal.muted })}
      ${ions}
      ${panel(700, 620, 340, 82, { fill: "rgba(8,14,24,0.78)", rx: 40 })}
      ${label(870, 674, ionLabel, { size: 23, fill: pal.accent2 })}
      ${arrow(640, 940, 720, 900, { color: pal.accent, width: 3, opacity: 0.5 })}
      ${label(CX, 1350, "Çözünen iyonlar akarsularla denize taşınır", { size: 25, fill: pal.muted })}
    `;
  },
};

export const riverToSea: VisualComponent = {
  id: "river_to_sea",
  labelTr: "Akarsu taşınımı: karadan denize",
  domains: ["earth", "geology", "environment"],
  mechanisms: ["river_to_sea"],
  concepts: ["river_transport", "sodium_ion", "chloride_ion", "ocean", "water_cycle", "water"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "tetrahedral_lattice"],
  scientificNote:
    "Akarsular çözünmüş iyonları (başlıca Na⁺, Cl⁻, Ca²⁺, HCO₃⁻) okyanuslara taşır. Taşınım milyonlarca yıl sürer; tuz denizde birikir.",
  params: [
    { name: "riverLabel", type: "string", default: "akarsu", desc: "Nehir etiketi" },
    { name: "seaLabel", type: "string", default: "okyanus", desc: "Deniz etiketi" },
    { name: "ionLabel", type: "string", default: "Na⁺ / Cl⁻", desc: "İyon etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const riverLabel = str(params, "riverLabel", "akarsu");
    const seaLabel = str(params, "seaLabel", "okyanus");
    const ionLabel = str(params, "ionLabel", "Na⁺ / Cl⁻");
    const seaTop = 1130;
    const pts = [
      { x: 120, y: 780 },
      { x: 300, y: 880 },
      { x: 500, y: 960 },
      { x: 720, y: 1050 },
      { x: 930, y: 1120 },
    ];
    const pathAt = (p: number) => {
      const raw = clamp(p) * (pts.length - 1);
      const i = Math.min(pts.length - 2, Math.floor(raw));
      const f = raw - i;
      return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * f, y: pts[i].y + (pts[i + 1].y - pts[i].y) * f };
    };
    const riverD = `M ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")}`;
    let flow = "";
    for (let i = 0; i < 26; i++) {
      const p = (t * 0.22 + rand(3, i)) % 1;
      const pt = pathAt(p);
      const isNa = i % 2 === 0;
      flow += glow(pt.x + rand(5, i) * 16, pt.y - 18 + Math.sin(t * 2 + i) * 8, 16, isNa ? "#ffd166" : "#5ad2ff", 0.3);
      flow += dot(pt.x + rand(5, i) * 16, pt.y - 18 + Math.sin(t * 2 + i) * 8, 7.5, isNa ? pal.accent2 : pal.accent, 0.95);
    }
    let seaWaves = "";
    for (let i = 0; i < 7; i++) {
      const y = seaTop + 40 + i * 54;
      seaWaves += `<path d="M 40 ${y} Q 280 ${y - 14} 520 ${y} T 1040 ${y}" fill="none" stroke="#5ad2ff" stroke-width="2.2" opacity="${n(0.12 + i * 0.02)}"/>`;
    }
    let seaIons = "";
    for (let i = 0; i < 30; i++) {
      const x = 60 + rand(17, i) * 950;
      const y = seaTop + 70 + rand(19, i) * 320;
      seaIons += dot(x, y, 4.5, i % 2 ? pal.accent2 : pal.accent, 0.5);
    }
    return `
      ${label(CX, 470, "TUZ KARADAN, AKARSULARLA GELİR", { size: 24, fill: pal.muted, letterSpacing: 1 })}
      <path d="M 0 900 Q 180 780 360 850 T 720 1010 L 640 1130 Q 320 1010 0 1040 Z" fill="rgba(70,120,120,0.16)"/>
      <rect x="0" y="${seaTop}" width="1080" height="700" fill="rgba(10,50,70,0.35)"/>
      ${seaWaves}
      ${seaIons}
      <path d="${riverD}" fill="none" stroke="rgba(90,210,255,0.22)" stroke-width="34" stroke-linecap="round"/>
      <path d="${riverD}" fill="none" stroke="rgba(160,240,255,0.75)" stroke-width="9" stroke-linecap="round"/>
      ${flow}
      ${label(250, 760, riverLabel, { size: 26, fill: "#bfe9ff" })}
      ${chip(830, 1240, seaLabel, { color: "#a9e8ff", size: 26, fill: "rgba(6,26,36,0.85)" })}
      ${chip(560, 930, ionLabel, { color: pal.accent2, size: 24, fill: "rgba(28,20,6,0.88)", stroke: "rgba(255,209,102,0.3)" })}
      ${label(CX, 1420, "Milyonlarca yıl boyunca iyonlar denizde birikir", { size: 24, fill: pal.muted })}
    `;
  },
};

export const ionSolution: VisualComponent = {
  id: "ion_solution",
  labelTr: "Çözeltide iyonlar ve hidratasyon",
  domains: ["chemistry", "earth"],
  mechanisms: ["ion_solution"],
  concepts: ["sodium_ion", "chloride_ion", "ion_hydration", "water", "ocean", "molecule"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "tectonic_plate"],
  scientificNote:
    "Su polar bir moleküldür; kısmi negatif oksijen ucu Na⁺'yı, kısmi pozitif hidrojen uçları Cl⁻'yi sarar. Bu hidratasyon iyonları çözeltide tutar.",
  params: [
    { name: "cationLabel", type: "string", default: "Na⁺", desc: "Katyon" },
    { name: "anionLabel", type: "string", default: "Cl⁻", desc: "Anyon" },
    { name: "waterLabel", type: "string", default: "su molekülü", desc: "Su etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const cationLabel = str(params, "cationLabel", "Na⁺");
    const anionLabel = str(params, "anionLabel", "Cl⁻");
    const waterLabel = str(params, "waterLabel", "su molekülü");
    const ions = [
      { x: 400, y: 780, label: cationLabel, color: pal.accent2, sign: "+" },
      { x: 700, y: 980, label: anionLabel, color: pal.accent, sign: "-" },
    ];
    let svg = "";
    svg += `<rect x="120" y="520" width="840" height="680" rx="60" fill="rgba(20,80,110,0.20)" stroke="rgba(120,200,230,0.35)" stroke-width="2.5"/>`;
    svg += `<rect x="120" y="520" width="840" height="90" rx="45" fill="rgba(120,220,255,0.10)"/>`;
    ions.forEach((ion, k) => {
      const bob = Math.sin(t * 1.1 + k) * 8;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + t * 0.25 * (k ? -1 : 1);
        svg += waterMolecule(ion.x + Math.cos(a) * 108, ion.y + bob + Math.sin(a) * 108, 30, a + Math.PI, "#8fd8ff", 0.75);
      }
      svg += glow(ion.x, ion.y + bob, 90, ion.color, 0.25);
      svg += circle(ion.x, ion.y + bob, 44, { fill: ion.color, opacity: 0.95 });
      svg += label(ion.x, ion.y + bob + 13, ion.label, { size: 32, fill: "#08121a", weight: 800, shadow: false });
    });
    for (let i = 0; i < 10; i++) {
      const x = 180 + rand(21, i) * 720;
      const y = 600 + rand(23, i) * 540;
      svg += waterMolecule(x, y + Math.sin(t * 0.9 + i) * 10, 22, rand(25, i) * 6.28, "rgba(143,216,255,0.6)", 0.5);
    }
    svg += label(CX, 470, "İYONLAR SUDA SERBEST DOLAŞIR", { size: 27, fill: pal.muted, letterSpacing: 3 });
    svg += chip(CX, 1280, waterLabel, { color: "#bfe9ff", size: 26, fill: "rgba(6,22,30,0.85)" });
    svg += label(CX, 1370, "Hidratasyon: su molekülleri iyonları sarar", { size: 24, fill: pal.muted });
    return svg;
  },
};

export const evaporationCycle: VisualComponent = {
  id: "evaporation_cycle",
  labelTr: "Buharlaşma ve tuz birikimi",
  domains: ["earth", "physics", "environment"],
  mechanisms: ["evaporation_cycle"],
  concepts: ["evaporation", "water_cycle", "ocean", "sodium_ion", "sunlight", "chloride_ion"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "neuron"],
  scientificNote:
    "Buharlaşma yalnızca su moleküllerini gaz fazına geçirir; çözünmüş tuzlar denizde kalır. Bu nedenle tuz derişimi zamanla artar.",
  params: [
    { name: "sunLabel", type: "string", default: "güneş", desc: "Güneş etiketi" },
    { name: "vaporLabel", type: "string", default: "su buharı", desc: "Buhar etiketi" },
    { name: "saltLabel", type: "string", default: "tuz", desc: "Tuz etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const sunLabel = str(params, "sunLabel", "güneş");
    const vaporLabel = str(params, "vaporLabel", "su buharı");
    const saltLabel = str(params, "saltLabel", "tuz");
    const seaY = 1120;
    let vapor = "";
    for (let i = 0; i < 22; i++) {
      const p = ((t * 0.22 + rand(29, i)) % 1);
      const x = 160 + rand(31, i) * 760 + Math.sin(p * 8 + i) * 22;
      const y = seaY - p * 620;
      vapor += dot(x, y, 5, "#bfe9ff", (1 - p) * 0.8);
    }
    let salt = "";
    for (let i = 0; i < 14; i++) {
      const x = 150 + rand(37, i) * 780;
      const y = seaY + 90 + rand(41, i) * 180;
      const r = 7;
      const pts = Array.from({ length: 6 }, (_, k) => {
        const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
        return `${n(x + Math.cos(a) * r)},${n(y + Math.sin(a) * r)}`;
      }).join(" ");
      salt += `<polygon points="${pts}" fill="rgba(255,255,255,0.75)"/>`;
    }
    return `
      ${glow(840, 420, 120, "#ffcf8a", 0.2)}
      ${circle(840, 420, 58, { fill: "#ffe6b0", opacity: 0.95 })}
      ${label(840, 500, sunLabel, { size: 23, fill: pal.muted })}
      ${vapor}
      ${chip(560, 560, vaporLabel, { color: "#cfeeff", size: 25, fill: "rgba(8,20,30,0.8)" })}
      <rect x="0" y="${seaY}" width="1080" height="800" fill="rgba(12,60,85,0.42)"/>
      <path d="M 0 ${seaY} Q 270 ${seaY - 22} 540 ${seaY} T 1080 ${seaY}" fill="none" stroke="rgba(140,225,255,0.6)" stroke-width="3"/>
      ${salt}
      ${chip(320, 1180, saltLabel, { color: pal.accent2, size: 26, fill: "rgba(28,20,6,0.85)", stroke: "rgba(255,209,102,0.3)" })}
      ${arrow(760, seaY + 260, 760, seaY + 60, { color: pal.accent, width: 4, opacity: 0.5 })}
      ${label(CX, 1400, "Su gider, tuz kalır: deniz tuzlanır", { size: 26, fill: pal.muted })}
    `;
  },
};
