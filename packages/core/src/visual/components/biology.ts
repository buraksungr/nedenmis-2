import { arrow, chip, circle, clamp, dot, easeInOut, easeOut, glow, label, n, panel, pulse, rand, seg } from "../primitives.js";
import type { VisualComponent } from "./types.js";
import { str } from "./types.js";

const CX = 540;
const CY = 860;

function mito(cx: number, cy: number, w: number, h: number, angle: number, color: string, opacity = 1): string {
  const rx = w / 2;
  const ry = h / 2;
  let cristae = "";
  for (let i = -2; i <= 2; i++) {
    const x = cx + i * rx * 0.3;
    cristae += `<path d="M ${n(x)} ${n(cy - ry * 0.62)} q ${n(rx * 0.16)} ${n(ry * 0.4)} 0 ${n(ry * 0.75)}" fill="none" stroke="${color}" stroke-width="2.2" opacity="${n(0.55 * opacity)}"/>`;
  }
  return `<g transform="rotate(${angle} ${n(cx)} ${n(cy)})" opacity="${opacity}">
    <ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="rgba(110,231,168,0.12)" stroke="${color}" stroke-width="3"/>
    <ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx - 10)}" ry="${n(ry - 9)}" fill="none" stroke="${color}" stroke-width="1.2" opacity="0.45"/>
    ${cristae}
  </g>`;
}

export const cellSection: VisualComponent = {
  id: "cell_section",
  labelTr: "Hücre kesiti ve organeller",
  domains: ["biology"],
  mechanisms: ["cell_section"],
  concepts: ["cell", "cell_membrane", "mitochondrion", "nucleus", "organelle"],
  incompatibleConcepts: ["tetrahedral_lattice", "cleavage_plane", "black_hole", "tectonic_plate", "electron"],
  scientificNote:
    "Ökaryot hücrede mitokondri çift zarlı bir organeldir ve sitoplazmada bulunur. Görsel ölçekli değil, şematiktir; organel sayıları temsilîdir.",
  params: [
    { name: "cellLabel", type: "string", default: "hücre", desc: "Hücre etiketi" },
    { name: "nucleusLabel", type: "string", default: "çekirdek", desc: "Çekirdek etiketi" },
    { name: "mitoLabel", type: "string", default: "mitokondri", desc: "Mitokondri etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const cellLabel = str(params, "cellLabel", "hücre");
    const nucleusLabel = str(params, "nucleusLabel", "çekirdek");
    const mitoLabel = str(params, "mitoLabel", "mitokondri");
    const highlight = pulse(t, 2.0);
    const org = [
      { x: 320, y: 1000, a: -18, s: 0.9 },
      { x: 800, y: 720, a: 22, s: 0.8 },
      { x: 730, y: 1090, a: -8, s: 1.0 },
    ];
    let organelles = "";
    org.forEach((o, i) => {
      organelles += glow(o.x, o.y, 60, pal.accent, 0.12 + (i === 2 ? highlight * 0.12 : 0));
      organelles += mito(o.x, o.y, 132 * o.s, 62 * o.s, o.a, pal.accent, 0.9);
    });
    return `
      ${label(CX, 470, "HÜCRENİN İÇİ", { size: 28, fill: pal.muted, letterSpacing: 5 })}
      <path d="M 250 560 Q 780 470 900 720 Q 980 940 830 1150 Q 650 1330 380 1230 Q 140 1120 170 880 Q 200 640 250 560 Z" fill="rgba(80,180,140,0.10)" stroke="rgba(110,231,168,0.6)" stroke-width="5"/>
      <path d="M 262 574 Q 770 490 886 728 Q 962 938 818 1138 Q 648 1306 392 1212 Q 160 1108 190 878 Q 216 652 262 574 Z" fill="none" stroke="rgba(110,231,168,0.25)" stroke-width="1.5"/>
      ${glow(560, 820, 210, "#6ee7a8", 0.1)}
      <circle cx="560" cy="820" r="150" fill="rgba(110,231,168,0.14)" stroke="rgba(150,241,200,0.65)" stroke-width="3"/>
      <circle cx="560" cy="820" r="52" fill="rgba(150,241,200,0.25)" stroke="rgba(150,241,200,0.5)" stroke-width="1.5"/>
      <path d="M 380 1120 q 40 -50 90 -20 q 30 20 60 -10" fill="none" stroke="rgba(110,231,168,0.4)" stroke-width="3"/>
      <path d="M 700 1180 q 50 -40 100 -10" fill="none" stroke="rgba(110,231,168,0.3)" stroke-width="3"/>
      ${organelles}
      ${label(560, 828, nucleusLabel, { size: 26, fill: "#d9ffe9", opacity: 0.9 })}
      ${chip(320, 1090, mitoLabel, { color: pal.accent, size: 23, fill: "rgba(6,24,16,0.85)" })}
      ${label(210, 720, cellLabel, { size: 26, fill: "#c9f4dd", anchor: "start", opacity: 0.85 })}
      ${circle(730, 1090, 100, { stroke: pal.accent2, strokeWidth: 2, opacity: 0.25 + highlight * 0.3, dash: "6 10" })}
      ${label(CX, 1400, "Mitokondri sitoplazmada, çekirdeğin dışında bulunur", { size: 23, fill: pal.muted })}
    `;
  },
};

export const mitochondrionCross: VisualComponent = {
  id: "mitochondrion_cross",
  labelTr: "Mitokondri kesiti ve kristalar",
  domains: ["biology"],
  mechanisms: ["mitochondrion_cross"],
  concepts: ["mitochondrion", "cristae", "cell_membrane", "proton_gradient", "electron_transport_chain", "organelle"],
  incompatibleConcepts: ["tetrahedral_lattice", "black_hole", "tectonic_plate", "cleavage_plane"],
  scientificNote:
    "Mitokondri çift zarlıdır. İç zar krista adı verilen kıvrımlar yaparak yüzey alanını artırır; elektron taşıma zinciri ve ATP sentaz bu zar üzerindedir.",
  params: [
    { name: "outerLabel", type: "string", default: "dış zar", desc: "Dış zar" },
    { name: "innerLabel", type: "string", default: "iç zar", desc: "İç zar" },
    { name: "cristaeLabel", type: "string", default: "krista", desc: "Krista" },
  ],
  render: ({ t, params, pal }) => {
    const outerLabel = str(params, "outerLabel", "dış zar");
    const innerLabel = str(params, "innerLabel", "iç zar");
    const cristaeLabel = str(params, "cristaeLabel", "krista");
    const glowPulse = pulse(t, 2.2);
    let folds = "";
    for (let i = 0; i < 5; i++) {
      const x = 300 + i * 120;
      const h = 190 + Math.sin(i * 1.7) * 30;
      folds += `<path d="M ${n(x)} ${n(700)} q ${n(60)} ${n(h * 0.35)} ${n(18)} ${n(h * 0.55)} q ${n(-34)} ${n(h * 0.22)} ${n(10)} ${n(h * 0.35)}" fill="none" stroke="${pal.accent}" stroke-width="5" opacity="0.8" stroke-linecap="round"/>`;
    }
    return `
      ${label(CX, 470, "İÇ ZARIN KIVRIMLARI: KRISTALAR", { size: 26, fill: pal.muted, letterSpacing: 3 })}
      ${glow(CX, 880, 360, "#6ee7a8", 0.1 + glowPulse * 0.05)}
      <ellipse cx="${CX}" cy="880" rx="410" ry="240" fill="rgba(110,231,168,0.08)" stroke="rgba(150,241,200,0.7)" stroke-width="5"/>
      <ellipse cx="${CX}" cy="880" rx="384" ry="214" fill="none" stroke="rgba(150,241,200,0.35)" stroke-width="2"/>
      ${folds}
      ${label(180, 700, outerLabel, { size: 23, fill: "#c9f4dd", anchor: "end" })}
      ${label(180, 760, innerLabel, { size: 23, fill: "#9fe8c0", anchor: "end" })}
      ${arrow(196, 694, 260, 720, { color: "#c9f4dd", width: 2, opacity: 0.6 })}
      ${arrow(196, 754, 250, 770, { color: "#9fe8c0", width: 2, opacity: 0.6 })}
      ${chip(720, 620, cristaeLabel, { color: pal.accent, size: 24, fill: "rgba(4,20,12,0.85)" })}
      ${arrow(720, 650, 660, 760, { color: pal.accent, width: 2.5, opacity: 0.7 })}
      ${label(CX, 1180, "Kristalar yüzey alanını büyütür", { size: 26, fill: pal.ink, opacity: 0.85 })}
      ${label(CX, 1250, "Elektron taşıma zinciri bu zarda çalışır", { size: 23, fill: pal.muted })}
      ${label(CX, 1330, "Zarlar arası boşlukta proton birikir", { size: 23, fill: pal.muted, opacity: 0.85 })}
    `;
  },
};

export const protonGradient: VisualComponent = {
  id: "proton_gradient",
  labelTr: "Proton eğimi (zarlar arası boşluk)",
  domains: ["biology", "chemistry"],
  mechanisms: ["proton_gradient"],
  concepts: ["proton_gradient", "electron_transport_chain", "cristae", "cell_membrane", "glucose", "oxygen", "atp"],
  incompatibleConcepts: ["tetrahedral_lattice", "black_hole", "tectonic_plate", "rayleigh_scattering"],
  scientificNote:
    "Elektron taşıma zinciri protonları zarlar arası boşluğa pompalar. Bu derişim farkı (proton motif kuvveti) ATP sentazı çalıştırır. Oksijen son elektron alıcısıdır.",
  params: [
    { name: "complexLabel", type: "string", default: "ETZ kompleksleri", desc: "Kompleks etiketi" },
    { name: "protonLabel", type: "string", default: "H⁺", desc: "Proton etiketi" },
    { name: "gradientLabel", type: "string", default: "proton eğimi", desc: "Eğim etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const complexLabel = str(params, "complexLabel", "ETZ kompleksleri");
    const protonLabel = str(params, "protonLabel", "H⁺");
    const gradientLabel = str(params, "gradientLabel", "proton eğimi");
    const memTop = 900;
    const memH = 90;
    let complexes = "";
    for (let i = 0; i < 3; i++) {
      const x = 260 + i * 210;
      complexes += `<rect x="${n(x)}" y="${memTop - 40}" width="110" height="${memH + 80}" rx="18" fill="rgba(110,231,168,0.25)" stroke="rgba(150,241,200,0.7)" stroke-width="2"/>`;
      complexes += label(x + 55, memTop + 62, ["I", "III", "IV"][i], { size: 26, fill: "#e9fff2", shadow: false });
    }
    let protons = "";
    for (let i = 0; i < 24; i++) {
      const column = i % 8;
      const row = Math.floor(i / 8);
      const p = ((t * 0.5 + i * 0.11) % 1);
      const x = 250 + column * 92 + Math.sin(t * 1.6 + i) * 8;
      const y = memTop - 70 - row * 44 + Math.sin(t * 2 + i) * 6;
      protons += dot(x, y, 8, pal.accent2, 0.9);
      if (i % 5 === 0) protons += label(x, y + 5, "H⁺", { size: 12, fill: "#0a1218", weight: 700, shadow: false });
      if (i < 8) {
        const py = memTop + 140 + p * 120;
        protons += dot(x + 30, py, 6, pal.accent2, (1 - p) * 0.5);
      }
    }
    const pumps = [0, 1, 2].map((i) => {
      const phase = (t * 0.6 + i * 0.3) % 1;
      const x = 315 + i * 210;
      return arrow(x, memTop + 10, x, memTop - 60 - phase * 20, { color: pal.accent, width: 3, opacity: 0.75 });
    });
    return `
      ${label(CX, 470, "PROTONLAR DIŞA POMPALANIR", { size: 27, fill: pal.muted, letterSpacing: 3 })}
      ${protons}
      ${pumps.join("")}
      <rect x="140" y="${memTop}" width="800" height="${memH}" rx="20" fill="rgba(110,231,168,0.16)" stroke="rgba(150,241,200,0.45)" stroke-width="2"/>
      ${complexes}
      ${label(CX, 690, "zarlar arası boşluk", { size: 23, fill: "#bfeed4", opacity: 0.8 })}
      ${label(CX, 1120, "matriks", { size: 23, fill: "#bfeed4", opacity: 0.75 })}
      ${chip(300, 640, gradientLabel, { color: pal.accent2, size: 24, fill: "rgba(26,20,6,0.85)" })}
      ${chip(540, 1180, complexLabel, { color: pal.accent, size: 23, fill: "rgba(4,20,12,0.85)" })}
      ${label(CX, 1300, "Derişim farkı potansiyel enerji depolar", { size: 24, fill: pal.muted })}
      ${label(CX, 1370, "Oksijen son elektron alıcısı olarak suya dönüşür", { size: 22, fill: pal.muted, opacity: 0.85 })}
    `;
  },
};

export const atpSynthaseRotor: VisualComponent = {
  id: "atp_synthase_rotor",
  labelTr: "ATP sentaz: dönen moleküler motor",
  domains: ["biology"],
  mechanisms: ["atp_synthase_rotor"],
  concepts: ["atp_synthase", "atp", "proton_gradient", "cell_membrane", "energy", "cristae"],
  incompatibleConcepts: ["tetrahedral_lattice", "black_hole", "tectonic_plate", "cleavage_plane"],
  scientificNote:
    "H⁺ akışı ATP sentazın rotorunu döndürür; enzim ADP ve inorganik fosfattan ATP üretir. Bu, hücrenin enerji dönüşümünün merkezidir; ATP 'üretilmiş yakıt' değil taşıyıcıdır.",
  params: [
    { name: "rotorLabel", type: "string", default: "ATP sentaz", desc: "Rotor etiketi" },
    { name: "protonLabel", type: "string", default: "H⁺", desc: "Proton etiketi" },
    { name: "atpLabel", type: "string", default: "ATP", desc: "ATP etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const rotorLabel = str(params, "rotorLabel", "ATP sentaz");
    const protonLabel = str(params, "protonLabel", "H⁺");
    const atpLabel = str(params, "atpLabel", "ATP");
    const memTop = 780;
    const memH = 86;
    const rotorY = memTop + memH + 120;
    const angle = t * 1.6;
    let spokes = "";
    for (let i = 0; i < 8; i++) {
      const a = angle + (i * Math.PI) / 4;
      spokes += `<line x1="${CX}" y1="${n(rotorY)}" x2="${n(CX + Math.cos(a) * 96)}" y2="${n(rotorY + Math.sin(a) * 96)}" stroke="${pal.accent}" stroke-width="5" opacity="0.6" stroke-linecap="round"/>`;
    }
    let protons = "";
    for (let i = 0; i < 10; i++) {
      const p = ((t * 0.45 + i * 0.1) % 1);
      const x = CX - 160 + rand(97, i) * 320;
      const y = memTop - 60 + p * 300;
      protons += dot(x, y, 7, pal.accent2, 1 - p * 0.3);
      if (i === 0) protons += label(x + 34, y, protonLabel, { size: 20, fill: pal.accent2 });
    }
    let atps = "";
    for (let i = 0; i < 6; i++) {
      const p = ((t * 0.35 + i / 6) % 1);
      const x = CX + 170 + p * 260;
      const y = rotorY + 40 + Math.sin(p * 6) * 30;
      atps += glow(x, y, 26, pal.accent2, 0.3 * (1 - p));
      atps += dot(x, y, 15, pal.accent2, 0.95 * (1 - p * 0.4));
      if (i === 0) atps += label(x, y - 30, atpLabel, { size: 22, fill: pal.accent2 });
    }
    return `
      ${label(CX, 470, "PROTON AKIŞI ROTORU DÖNDÜRÜR", { size: 27, fill: pal.muted, letterSpacing: 3 })}
      <rect x="180" y="${memTop}" width="720" height="${memH}" rx="18" fill="rgba(110,231,168,0.16)" stroke="rgba(150,241,200,0.45)" stroke-width="2"/>
      <rect x="${CX - 70}" y="${memTop - 26}" width="140" height="${memH + 52}" rx="18" fill="rgba(150,241,200,0.22)" stroke="${pal.accent}" stroke-width="2.5"/>
      ${protons}
      ${spokes}
      <circle cx="${CX}" cy="${n(rotorY)}" r="110" fill="rgba(110,231,168,0.12)" stroke="${pal.accent}" stroke-width="3"/>
      <circle cx="${CX}" cy="${n(rotorY)}" r="34" fill="${pal.accent}" opacity="0.8"/>
      ${label(CX, rotorY + 8, "⟳", { size: 40, fill: "#04120c", shadow: false })}
      ${atps}
      ${chip(CX, 660, rotorLabel, { color: pal.accent, size: 25, fill: "rgba(4,20,12,0.85)" })}
      ${label(CX, 1310, "Her dönüşte ADP + fosfat → ATP", { size: 25, fill: pal.ink, opacity: 0.88 })}
      ${label(CX, 1380, "Bu, hücrenin kullanılabilir enerji taşıyıcısıdır", { size: 23, fill: pal.muted })}
    `;
  },
};

export const metabolismSummary: VisualComponent = {
  id: "metabolism_summary",
  labelTr: "Metabolik girdi–çıktı özeti",
  domains: ["biology", "chemistry"],
  mechanisms: ["metabolism_summary"],
  concepts: ["glucose", "oxygen", "carbon_dioxide", "water", "atp", "energy", "light_reaction", "calvin_cycle"],
  incompatibleConcepts: ["tetrahedral_lattice", "black_hole", "tectonic_plate", "rayleigh_scattering"],
  scientificNote:
    "Hücresel solunumda C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP. Fotosentezde yön terstir ve ışık gerekir. Görsel, metindeki denkleme bağlı kalır.",
  params: [
    { name: "inputLabel", type: "string", default: "glikoz + O₂", desc: "Girdi etiketi" },
    { name: "outputLabel", type: "string", default: "ATP + CO₂ + H₂O", desc: "Çıktı etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const inputLabel = str(params, "inputLabel", "glikoz + O₂");
    const outputLabel = str(params, "outputLabel", "ATP + CO₂ + H₂O");
    const flow = (t * 0.4) % 1;
    let dots = "";
    for (let i = 0; i < 14; i++) {
      const p = ((t * 0.35 + i / 14) % 1);
      const x = 300 + p * 480;
      const y = 880 + Math.sin(p * 8 + i) * 26;
      dots += dot(x, y, 7, i % 2 ? pal.accent2 : pal.accent, 0.8 * (1 - Math.abs(p - 0.5) * 0.6));
    }
    return `
      ${label(CX, 470, "GİRDİ → ÇIKTI", { size: 28, fill: pal.muted, letterSpacing: 5 })}
      ${panel(60, 640, 400, 380, { fill: "rgba(8,22,18,0.6)", stroke: "rgba(110,231,168,0.25)" })}
      ${panel(620, 640, 400, 380, { fill: "rgba(30,22,8,0.55)", stroke: "rgba(255,209,102,0.3)" })}
      ${label(260, 590, "GİRDİ", { size: 26, fill: pal.accent, letterSpacing: 3 })}
      ${label(820, 590, "ÇIKTI", { size: 26, fill: pal.accent2, letterSpacing: 3 })}
      ${label(260, 840, inputLabel, { size: 34, fill: pal.ink, weight: 700 })}
      ${label(820, 840, outputLabel, { size: 32, fill: pal.ink, weight: 700 })}
      ${dots}
      ${arrow(470, 880, 610, 880, { color: pal.ink, width: 5, opacity: 0.7 })}
      ${label(540, 810, "metabolizma", { size: 22, fill: pal.muted })}
      ${label(CX, 1130, "Enerji yaratılmaz, dönüştürülür", { size: 26, fill: pal.ink, opacity: 0.85 })}
      ${label(CX, 1210, "ATP hücrenin enerji taşıyıcısıdır", { size: 23, fill: pal.muted })}
      ${label(CX, 1290, "Kütle korunur: atomlar yeniden düzenlenir", { size: 23, fill: pal.muted, opacity: 0.85 })}
    `;
  },
};
