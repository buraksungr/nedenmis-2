import { arrow, chip, circle, clamp, dot, easeOut, glow, label, n, panel, pulse, rand, seg } from "../primitives.js";
import type { VisualComponent } from "./types.js";
import { str, num } from "./types.js";

const CX = 540;

export const electronSea: VisualComponent = {
  id: "electron_sea",
  labelTr: "Metal örgüsü ve serbest elektron denizi",
  domains: ["physics", "chemistry", "materials"],
  mechanisms: ["electron_sea"],
  concepts: ["metal_lattice", "free_electron", "atom", "electron", "current"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "tectonic_plate", "chloroplast"],
  scientificNote:
    "Metallerde değerlik elektronları belirli bir atoma bağlı değildir; kristal boyunca delokalize olur. Bu 'elektron denizi' metallerin iletkenliğinin temelidir.",
  params: [
    { name: "ionLabel", type: "string", default: "metal iyonu", desc: "İyon etiketi" },
    { name: "electronLabel", type: "string", default: "serbest elektron", desc: "Elektron etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const ionLabel = str(params, "ionLabel", "metal iyonu");
    const electronLabel = str(params, "electronLabel", "serbest elektron");
    const cols = 5;
    const rows = 4;
    const sx = 175;
    const sy = 140;
    const ox = CX - ((cols - 1) * sx) / 2;
    const oy = 640;
    let ions = "";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = ox + c * sx + (r % 2) * 26;
        const y = oy + r * sy;
        ions += glow(x, y, 60, pal.accent, 0.10);
        ions += circle(x, y, 34, { fill: "rgba(90,210,255,0.16)", stroke: "rgba(120,225,255,0.55)", strokeWidth: 2 });
        ions += label(x, y + 9, "+", { size: 30, fill: pal.accent, weight: 700, shadow: false });
      }
    }
    let electrons = "";
    for (let i = 0; i < 26; i++) {
      const px = ox - 40 + rand(67, i) * ((cols - 1) * sx + 80);
      const py = oy - 30 + ((t * (26 + rand(71, i) * 40) + rand(73, i) * 480) % (rows * sy + 60)) ;
      const wob = Math.sin(t * 2.4 + i) * 14;
      electrons += glow(px + wob, py, 18, pal.accent2, 0.28);
      electrons += dot(px + wob, py, 7.5, pal.accent2, 0.95);
    }
    return `
      ${label(CX, 470, "METALDE ELEKTRONLAR SERBESTTİR", { size: 27, fill: pal.muted, letterSpacing: 3 })}
      ${panel(70, 500, 940, 660, { fill: "rgba(8,20,30,0.45)", stroke: "rgba(90,210,255,0.16)" })}
      ${ions}
      ${electrons}
      ${chip(250, 1210, ionLabel, { color: pal.accent, size: 24, fill: "rgba(6,20,28,0.85)" })}
      ${chip(790, 1210, electronLabel, { color: pal.accent2, size: 24, fill: "rgba(28,20,6,0.85)" })}
      ${label(CX, 1310, "Pozitif iyonlar yerinde titreşir, elektronlar dolaşır", { size: 24, fill: pal.muted })}
    `;
  },
};

export const electronDrift: VisualComponent = {
  id: "electron_drift",
  labelTr: "Elektrik alanı ve elektron sürüklenmesi",
  domains: ["physics", "technology"],
  mechanisms: ["electron_drift"],
  concepts: ["electric_field", "drift_velocity", "current", "free_electron", "electron", "metal_lattice"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "neuron", "covalent_bond"],
  scientificNote:
    "Elektronlar elektrik alanına zıt yönde sürüklenir. Sürüklenme hızı çok küçüktür (μm/s mertebesi); sinyalin hızlı yayılması alanın iletimidir.",
  params: [
    { name: "fieldLabel", type: "string", default: "elektrik alanı", desc: "Alan etiketi" },
    { name: "electronLabel", type: "string", default: "elektron", desc: "Elektron etiketi" },
    { name: "batteryLabel", type: "string", default: "pil", desc: "Pil etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const fieldLabel = str(params, "fieldLabel", "elektrik alanı");
    const electronLabel = str(params, "electronLabel", "elektron");
    const batteryLabel = str(params, "batteryLabel", "pil");
    const wireY = 900;
    const wireH = 170;
    let fields = "";
    for (let i = 0; i < 6; i++) {
      const x = 220 + i * 130;
      fields += arrow(x, wireY - 130, x + 80, wireY - 130, { color: pal.accent3, width: 2.5, opacity: 0.6, head: 9 });
    }
    let electrons = "";
    for (let i = 0; i < 22; i++) {
      const speed = 90 + rand(79, i) * 50;
      const x = 180 + ((rand(83, i) * 900 - t * speed + 900) % 820);
      const y = wireY - wireH / 2 + 30 + rand(89, i) * (wireH - 60);
      const jitter = Math.sin(t * 6 + i) * 6;
      electrons += dot(x, y + jitter, 8, pal.accent2, 0.95);
      electrons += glow(x, y + jitter, 20, pal.accent2, 0.2);
    }
    const flowP = (t * 0.35) % 1;
    return `
      ${label(CX, 470, "GERİLİM ELEKTRONLARI SÜRÜKLER", { size: 27, fill: pal.muted, letterSpacing: 3 })}
      ${panel(140, 560, 800, 500, { fill: "rgba(8,16,28,0.55)", stroke: "rgba(157,140,255,0.18)" })}
      <rect x="150" y="${wireY - wireH / 2}" width="780" height="${wireH}" rx="40" fill="rgba(90,210,255,0.10)" stroke="rgba(90,210,255,0.35)" stroke-width="2"/>
      ${fields}
      ${electrons}
      ${chip(300, 660, fieldLabel, { color: pal.accent3, size: 24, fill: "rgba(16,12,32,0.85)" })}
      ${arrow(180, 1230, 420, 1230, { color: pal.accent, width: 4 })}
      ${label(300, 1280, "sürüklenme yönü", { size: 23, fill: pal.accent })}
      ${panel(430, 1180, 220, 150, { fill: "rgba(8,20,30,0.7)", stroke: "rgba(255,255,255,0.12)", rx: 18 })}
      ${label(540, 1230, "—  ‖ —", { size: 34, fill: pal.ink })}
      ${label(540, 1290, batteryLabel, { size: 22, fill: pal.muted })}
      ${label(540, 1300, electronLabel, { size: 22, fill: pal.ink, opacity: 0.9 })}
      ${dot(540 - 200 + flowP * 400, 1120, 5, pal.accent2, 0.6)}
      ${chip(850, 1230, "I →", { color: pal.ink, size: 26, fill: "rgba(8,18,28,0.8)" })}
      ${label(CX, 1380, "Sürüklenme hızı küçüktür; alan ışık hızına yakın yayılır", { size: 22, fill: pal.muted })}
    `;
  },
};

export const resistanceHeat: VisualComponent = {
  id: "resistance_heat",
  labelTr: "Direnç: çarpışmalar ve ısınma",
  domains: ["physics", "engineering"],
  mechanisms: ["resistance_heat"],
  concepts: ["collision_scattering", "metal_lattice", "drift_velocity", "current", "energy", "electron"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "tectonic_plate"],
  scientificNote:
    "Elektronların iyonlarla çarpışması enerji kaybına (direnç) ve joule ısınmasına yol açar. Direnç malzemenin yapısına ve sıcaklığa bağlıdır.",
  params: [
    { name: "collisionLabel", type: "string", default: "çarpışma", desc: "Çarpışma etiketi" },
    { name: "heatLabel", type: "string", default: "ısı", desc: "Isı etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const collisionLabel = str(params, "collisionLabel", "çarpışma");
    const heatLabel = str(params, "heatLabel", "ısı");
    const heat = easeOut(seg(t, 0.5, 3.5));
    const wireY = 900;
    let ions = "";
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 6; c++) {
        const x = 200 + c * 130;
        const y = wireY - 60 + r * 60;
        const vib = Math.sin(t * (8 + heat * 14) + r + c) * (3 + heat * 9);
        ions += circle(x + vib, y, 20, { fill: "rgba(255,209,102,0.22)", stroke: "rgba(255,209,102,0.6)", strokeWidth: 1.6 });
        ions += label(x + vib, y + 6, "+", { size: 18, fill: pal.accent2, shadow: false });
      }
    }
    let trail = "";
    for (let i = 0; i < 16; i++) {
      const p = (t * (0.9 + heat * 0.4) + i * 0.13) % 1;
      const x = 180 + p * 720;
      const y = wireY + Math.sin(p * 26 + i) * 34 + Math.cos(p * 11) * 18;
      trail += dot(x, y, 6, "#8fe3ff", 0.85);
      if (i % 4 === 0) trail += dot(x, y, 22, "#ffd166", 0.16 * heat);
    }
    return `
      ${label(CX, 470, "DİRENÇ: ELEKTRON–İYON ÇARPIŞMALARI", { size: 26, fill: pal.muted, letterSpacing: 2 })}
      <rect x="150" y="${wireY - 130}" width="780" height="260" rx="44" fill="rgba(${Math.round(120 + 90 * heat)},${Math.round(70 + 40 * heat)},40,${n(0.12 + heat * 0.22)})" stroke="rgba(255,180,110,0.35)" stroke-width="2"/>
      ${ions}
      ${trail}
      ${glow(CX, wireY, 260, "#ff9d5c", 0.1 + heat * 0.22)}
      ${chip(300, 660, collisionLabel, { color: pal.accent2, size: 24, fill: "rgba(30,20,8,0.85)" })}
      ${panel(760, 560, 180, 220, { fill: "rgba(8,16,26,0.7)", stroke: "rgba(255,255,255,0.12)", rx: 16 })}
      <rect x="800" y="740" width="34" height="0" fill="${pal.accent2}"/>
      <rect x="800" y="${n(740 - heat * 120)}" width="34" height="${n(heat * 120)}" rx="12" fill="#ff8a5c"/>
      <rect x="800" y="620" width="34" height="130" rx="12" fill="rgba(255,255,255,0.08)"/>
      ${label(880, 610, "℃", { size: 24, fill: pal.muted })}
      ${label(850, 820, heatLabel, { size: 22, fill: pal.ink, opacity: 0.8 })}
      ${label(CX, 1290, "Elektronlar enerji kaybeder; tel ısınır", { size: 25, fill: pal.muted })}
      ${label(CX, 1390, "Direnç akımı sınırlar", { size: 24, fill: pal.muted, opacity: 0.8 })}
    `;
  },
};

export const insulatorCompare: VisualComponent = {
  id: "insulator_compare",
  labelTr: "İletken ve yalıtkan karşılaştırması",
  domains: ["physics", "materials", "engineering"],
  mechanisms: ["insulator_compare"],
  concepts: ["insulator", "electron", "current", "metal_lattice", "electric_field", "atom"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "tectonic_plate"],
  scientificNote:
    "Yalıtkanlarda elektronlar atomlara bağlıdır; serbest taşıyıcı yoktur. Bu yüzden elektrik alan uygulansa bile kalıcı akım oluşmaz (ideal yalıtkanda).",
  params: [
    { name: "conductorLabel", type: "string", default: "iletken", desc: "İletken etiketi" },
    { name: "insulatorLabel", type: "string", default: "yalıtkan", desc: "Yalıtkan etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const conductorLabel = str(params, "conductorLabel", "iletken");
    const insulatorLabel = str(params, "insulatorLabel", "yalıtkan");
    const cells = [
      { x: 70, label: conductorLabel, color: pal.accent, conductor: true },
      { x: 560, label: insulatorLabel, color: pal.accent3, conductor: false },
    ];
    let svg = "";
    cells.forEach((cell, k) => {
      svg += panel(cell.x, 560, 450, 620, { fill: "rgba(8,16,26,0.5)", stroke: "rgba(255,255,255,0.09)" });
      svg += label(cell.x + 225, 630, cell.label, { size: 30, fill: cell.color, letterSpacing: 3 });
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const x = cell.x + 95 + c * 130;
          const y = 760 + r * 130;
          svg += circle(x, y, 26, { fill: "rgba(255,255,255,0.06)", stroke: "rgba(255,255,255,0.2)", strokeWidth: 1.6 });
          if (cell.conductor) {
            const p = (t * 0.5 + r * 0.2 + c * 0.1) % 1;
            svg += dot(x - 60 + p * 120, y - 40 + Math.sin(p * 6 + r) * 26, 6.5, pal.accent2, 0.9);
          } else {
            for (let e = 0; e < 2; e++) {
              const a = t * 0.5 + e * Math.PI + c;
              svg += dot(x + Math.cos(a) * 14, y + Math.sin(a) * 14, 5, pal.accent3, 0.85);
              svg += circle(x, y, 20, { stroke: pal.accent3, strokeWidth: 1, opacity: 0.25 });
            }
          }
        }
      }
      svg += chip(cell.x + 225, 1120, cell.conductor ? "akım akar" : "akım akmaz", {
        color: cell.conductor ? pal.accent2 : "#ffb0a0",
        size: 24,
        fill: "rgba(8,14,24,0.85)",
      });
    });
    svg += label(CX, 470, "SERBEST YÜK TAŞIYICISI VAR MI?", { size: 27, fill: pal.muted, letterSpacing: 3 });
    svg += arrow(430, 900, 500, 900, { color: pal.accent2, width: 3, opacity: 0.5 });
    svg += label(CX, 1290, "Metallerde elektronlar serbest; yalıtkanlarda bağlı", { size: 24, fill: pal.muted });
    return svg;
  },
};
