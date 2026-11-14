import { arrow, chip, circle, clamp, dot, easeInOut, easeOut, glow, label, n, panel, pulse, rand, seg } from "../primitives.js";
import type { VisualComponent } from "./types.js";
import { str } from "./types.js";

const CX = 540;

export const leafSection: VisualComponent = {
  id: "leaf_section",
  labelTr: "Yaprak kesiti ve gaz alışverişi",
  domains: ["biology", "environment"],
  mechanisms: ["leaf_section"],
  concepts: ["stomata", "chlorophyll", "chloroplast", "carbon_dioxide", "oxygen", "sunlight_energy", "water"],
  incompatibleConcepts: ["black_hole", "tectonic_plate", "tetrahedral_lattice", "event_horizon"],
  scientificNote:
    "Stomalar gaz alışverişini sağlar: CO₂ girer, O₂ ve su buharı çıkar. Kloroplastlar mezofil hücrelerinde yoğundur; Epidermis hücrelerinde kloroplast yoktur.",
  params: [
    { name: "leafLabel", type: "string", default: "yaprak", desc: "Yaprak etiketi" },
    { name: "stomataLabel", type: "string", default: "stoma", desc: "Stoma etiketi" },
    { name: "co2Label", type: "string", default: "CO₂", desc: "CO₂ etiketi" },
    { name: "o2Label", type: "string", default: "O₂", desc: "O₂ etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const leafLabel = str(params, "leafLabel", "yaprak");
    const stomataLabel = str(params, "stomataLabel", "stoma");
    const co2Label = str(params, "co2Label", "CO₂");
    const o2Label = str(params, "o2Label", "O₂");
    let cells = "";
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 6; c++) {
        const x = 200 + c * 130;
        const y = 660 + r * 120;
        cells += `<rect x="${x}" y="${y}" width="104" height="94" rx="26" fill="rgba(110,231,168,0.10)" stroke="rgba(150,241,200,0.28)" stroke-width="1.5"/>`;
        if (r < 2) {
          for (let k = 0; k < 3; k++) {
            cells += `<ellipse cx="${x + 26 + k * 26}" cy="${y + 44 + (k % 2) * 12}" rx="13" ry="8" fill="rgba(110,231,168,0.55)"/>`;
          }
        }
      }
    }
    let rays = "";
    for (let i = 0; i < 5; i++) {
      const x = 240 + i * 150;
      rays += `<line x1="${n(x)}" y1="420" x2="${n(x + 26)}" y2="600" stroke="#ffe9a8" stroke-width="3" opacity="0.45"/>`;
      rays += dot(x + ((t * 40) % 26), 420 + ((t * 160) % 180), 5, "#fff2c8", 0.8);
    }
    let gases = "";
    for (let i = 0; i < 10; i++) {
      const p = ((t * 0.4 + i / 10) % 1);
      const x = 790 + Math.sin(i) * 40;
      const y = 1180 - p * 220;
      gases += dot(x, y, 7, "#8fd8ff", (1 - p) * 0.85);
    }
    for (let i = 0; i < 8; i++) {
      const p = ((t * 0.35 + i / 8) % 1);
      const x = 300 + rand(101, i) * 120;
      const y = 1240 - p * 200;
      gases += dot(x, y, 7, "#ffd166", (1 - p) * 0.85);
    }
    return `
      ${rays}
      <rect x="160" y="620" width="780" height="120" rx="20" fill="rgba(150,241,200,0.10)"/>
      ${cells}
      <path d="M 160 1180 L 940 1180" stroke="rgba(150,241,200,0.5)" stroke-width="3"/>
      <path d="M 300 1180 q 50 -40 100 0 M 680 1180 q 50 -40 100 0" fill="none" stroke="rgba(150,241,200,0.55)" stroke-width="3"/>
      ${label(350, 1230, stomataLabel, { size: 22, fill: "#c9f4dd" })}
      ${gases}
      ${chip(1000, 1080, co2Label, { color: "#8fd8ff", size: 22, fill: "rgba(6,20,30,0.85)" })}
      ${chip(1000, 1140, o2Label, { color: "#ffd166", size: 22, fill: "rgba(30,22,6,0.85)" })}
      ${label(180, 560, leafLabel, { size: 26, fill: "#c9f4dd", anchor: "start" })}
      ${label(CX, 1330, "Kloroplastlar ışığı soğurur", { size: 25, fill: pal.ink, opacity: 0.85 })}
      ${label(CX, 1400, "CO₂ girer, O₂ çıkar", { size: 23, fill: pal.muted })}
    `;
  },
};

export const chloroplastZoom: VisualComponent = {
  id: "chloroplast_zoom",
  labelTr: "Kloroplast ve tilakoid zarları",
  domains: ["biology"],
  mechanisms: ["chloroplast_zoom"],
  concepts: ["chloroplast", "chlorophyll", "sunlight_energy", "light_reaction", "cell_membrane"],
  incompatibleConcepts: ["black_hole", "tectonic_plate", "tetrahedral_lattice", "event_horizon"],
  scientificNote:
    "Kloroplast çift zarlıdır; içinde tilakoid zarların üst üste dizildiği grana bulunur. Klorofil ışığı soğurur; ışık tepkimeleri tilakoid zarında gerçekleşir.",
  params: [
    { name: "chloroplastLabel", type: "string", default: "kloroplast", desc: "Kloroplast" },
    { name: "thylakoidLabel", type: "string", default: "tilakoid zar", desc: "Tilakoid" },
    { name: "chlorophyllLabel", type: "string", default: "klorofil", desc: "Klorofil" },
  ],
  render: ({ t, params, pal }) => {
    const chloroplastLabel = str(params, "chloroplastLabel", "kloroplast");
    const thylakoidLabel = str(params, "thylakoidLabel", "tilakoid zar");
    const chlorophyllLabel = str(params, "chlorophyllLabel", "klorofil");
    let grana = "";
    for (let g = 0; g < 3; g++) {
      const gx = 330 + g * 190;
      const gy = 800 + (g % 2) * 90;
      for (let i = 0; i < 5; i++) {
        grana += `<rect x="${n(gx - 60)}" y="${n(gy + i * 26)}" width="120" height="16" rx="8" fill="rgba(110,231,168,${0.42 + (i % 2) * 0.16})" stroke="rgba(180,255,215,0.4)" stroke-width="1"/>`;
      }
    }
    let rays = "";
    for (let i = 0; i < 4; i++) {
      const x = 220 + i * 200;
      rays += `<line x1="${n(x)}" y1="470" x2="${n(x + 40)}" y2="700" stroke="#ffe9a8" stroke-width="4" opacity="0.5"/>`;
    }
    const shine = pulse(t, 1.8);
    return `
      ${rays}
      ${glow(CX, 860, 330, "#6ee7a8", 0.12 + shine * 0.05)}
      <ellipse cx="${CX}" cy="860" rx="380" ry="240" fill="rgba(110,231,168,0.10)" stroke="rgba(150,241,200,0.7)" stroke-width="4"/>
      <ellipse cx="${CX}" cy="860" rx="352" ry="214" fill="none" stroke="rgba(150,241,200,0.32)" stroke-width="2"/>
      ${grana}
      ${circle(700, 720, 84, { stroke: "#ffe9a8", strokeWidth: 2, opacity: 0.4, dash: "6 10" })}
      ${chip(700, 720, chlorophyllLabel, { color: "#ffe9a8", size: 21, fill: "rgba(30,24,8,0.8)" })}
      ${chip(CX, 1170, chloroplastLabel, { color: "#c9f4dd", size: 25, fill: "rgba(4,20,12,0.85)" })}
      ${chip(800, 980, thylakoidLabel, { color: pal.accent, size: 21, fill: "rgba(4,20,12,0.85)" })}
      ${arrow(800, 950, 730, 900, { color: pal.accent, width: 2, opacity: 0.6 })}
      ${label(CX, 1300, "Granalar tilakoid zarların yığınlarıdır", { size: 24, fill: pal.muted })}
      ${label(CX, 1370, "Klorofil mavi ve kırmızıyı soğurur, yeşili yansıtır", { size: 22, fill: pal.muted, opacity: 0.85 })}
    `;
  },
};

export const lightReaction: VisualComponent = {
  id: "light_reaction",
  labelTr: "Işığa bağımlı tepkimeler",
  domains: ["biology"],
  mechanisms: ["light_reaction"],
  concepts: ["light_reaction", "water", "oxygen", "energy", "chloroplast", "chlorophyll", "atp"],
  incompatibleConcepts: ["black_hole", "tectonic_plate", "tetrahedral_lattice", "event_horizon"],
  scientificNote:
    "Işık tepkimelerinde su fotolizi ile O₂ açığa çıkar; elektronlar taşınırken ATP ve NADPH üretilir. Oksijenin kaynağı sudur, CO₂ değil.",
  params: [
    { name: "waterLabel", type: "string", default: "H₂O", desc: "Su etiketi" },
    { name: "oxygenLabel", type: "string", default: "O₂", desc: "Oksijen etiketi" },
    { name: "atpLabel", type: "string", default: "ATP", desc: "ATP etiketi" },
    { name: "nadphLabel", type: "string", default: "NADPH", desc: "NADPH etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const waterLabel = str(params, "waterLabel", "H₂O");
    const oxygenLabel = str(params, "oxygenLabel", "O₂");
    const atpLabel = str(params, "atpLabel", "ATP");
    const nadphLabel = str(params, "nadphLabel", "NADPH");
    const memY = 880;
    let photons = "";
    for (let i = 0; i < 5; i++) {
      const p = ((t * 0.5 + i / 5) % 1);
      const x = 300 + i * 110;
      photons += dot(x, 520 + p * 300, 7, "#ffe9a8", 1 - p * 0.4);
      photons += `<line x1="${n(x)}" y1="${n(520 + p * 300)}" x2="${n(x - 12)}" y2="${n(500 + p * 300)}" stroke="#ffe9a8" stroke-width="2" opacity="0.5"/>`;
    }
    let split = "";
    for (let i = 0; i < 3; i++) {
      const p = ((t * 0.4 + i / 3) % 1);
      split += dot(300 + i * 30, memY - 40 + p * 90, 6, "#8fd8ff", 1 - p * 0.5);
      split += dot(360 + i * 30, memY - 40 + p * 90, 5, "#ffd166", 1 - p * 0.5);
    }
    return `
      ${label(CX, 470, "IŞIK TEPKİMELERİ: SU AYRIŞIR", { size: 25, fill: pal.muted, letterSpacing: 2 })}
      ${photons}
      <rect x="180" y="${memY}" width="720" height="70" rx="16" fill="rgba(110,231,168,0.18)" stroke="rgba(150,241,200,0.5)" stroke-width="2"/>
      ${split}
      ${chip(250, 1080, waterLabel, { color: "#8fd8ff", size: 26, fill: "rgba(6,20,30,0.85)" })}
      ${arrow(250, 1050, 300, 960, { color: "#8fd8ff", width: 2.5, opacity: 0.7 })}
      ${chip(250, 740, oxygenLabel, { color: "#ffd166", size: 24, fill: "rgba(30,22,6,0.85)" })}
      ${arrow(300, 800, 340, 860, { color: "#ffd166", width: 2.5, opacity: 0.7 })}
      ${chip(840, 700, atpLabel, { color: pal.accent2, size: 25, fill: "rgba(30,22,6,0.85)" })}
      ${chip(840, 780, nadphLabel, { color: pal.accent3, size: 23, fill: "rgba(20,16,36,0.85)" })}
      ${arrow(800, 760, 720, 860, { color: pal.accent2, width: 2.5, opacity: 0.6 })}
      ${label(CX, 1180, "ATP ve NADPH Calvin döngüsüne gider", { size: 24, fill: pal.muted })}
      ${label(CX, 1260, "Açığa çıkan oksijen sudan gelir", { size: 26, fill: pal.ink, opacity: 0.88 })}
      ${label(CX, 1350, "Bu adım ışık gerektirir", { size: 23, fill: pal.muted, opacity: 0.85 })}
    `;
  },
};

export const calvinCycle: VisualComponent = {
  id: "calvin_cycle",
  labelTr: "Calvin döngüsü",
  domains: ["biology"],
  mechanisms: ["calvin_cycle"],
  concepts: ["calvin_cycle", "carbon_dioxide", "glucose", "light_reaction", "energy", "atp"],
  incompatibleConcepts: ["black_hole", "tectonic_plate", "tetrahedral_lattice", "event_horizon"],
  scientificNote:
    "Calvin döngüsünde CO₂, RuBisCO ile bağlanır; ATP ve NADPH kullanılarak şeker üretilir. Döngü, ışıktan bağımsızdır ama ATP/NADPH gerektirir.",
  params: [
    { name: "co2Label", type: "string", default: "CO₂", desc: "CO2 etiketi" },
    { name: "cycleLabel", type: "string", default: "Calvin döngüsü", desc: "Döngü etiketi" },
    { name: "sugarLabel", type: "string", default: "glikoz", desc: "Şeker etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const co2Label = str(params, "co2Label", "CO₂");
    const cycleLabel = str(params, "cycleLabel", "Calvin döngüsü");
    const sugarLabel = str(params, "sugarLabel", "glikoz");
    const cy = 880;
    const R = 230;
    const rot = t * 0.35;
    const nodes = ["CO₂ bağlama", "indirgeme", "yenilenme"];
    let ring = circle(CX, cy, R, { stroke: "rgba(110,231,168,0.35)", strokeWidth: 3 });
    let arrows = "";
    for (let i = 0; i < 3; i++) {
      const a0 = rot + (i * Math.PI * 2) / 3;
      const a1 = a0 + 1.5;
      const x0 = CX + Math.cos(a0) * R;
      const y0 = cy + Math.sin(a0) * R;
      const x1 = CX + Math.cos(a1) * R;
      const y1 = cy + Math.sin(a1) * R;
      arrows += arrow(x0, y0, x1, y1, { color: pal.accent, width: 3, opacity: 0.55, head: 14 });
      const nx = CX + Math.cos(a0 + 0.75) * (R + 70);
      const ny = cy + Math.sin(a0 + 0.75) * (R + 70);
      arrows += label(nx, ny, nodes[i], { size: 21, fill: "#c9f4dd", opacity: 0.85 });
    }
    const co2p = (t * 0.4) % 1;
    const sugarp = (t * 0.3) % 1;
    return `
      ${label(CX, 470, "CALVIN DÖNGÜSÜ: KARBON BAĞLAMA", { size: 25, fill: pal.muted, letterSpacing: 2 })}
      ${glow(CX, cy, 260, "#6ee7a8", 0.08)}
      ${ring}
      ${arrows}
      ${dot(CX + 420 - co2p * 190, cy - 120, 8, "#8fd8ff", 0.95)}
      ${chip(870, 700, co2Label, { color: "#8fd8ff", size: 24, fill: "rgba(6,20,30,0.85)" })}
      ${arrow(880, 730, 800, 780, { color: "#8fd8ff", width: 2.5, opacity: 0.65 })}
      ${dot(CX + 240 + sugarp * 120, cy + 200, 9, pal.accent2, 0.95)}
      ${chip(830, 1140, sugarLabel, { color: pal.accent2, size: 24, fill: "rgba(30,22,6,0.85)" })}
      ${chip(CX, cy + 8, cycleLabel, { color: "#c9f4dd", size: 24, fill: "rgba(4,20,12,0.7)" })}
      ${label(CX, 1300, "ATP ve NADPH bu döngüde harcanır", { size: 24, fill: pal.muted })}
      ${label(CX, 1370, "Ürün: glikoz ve diğer organik moleküller", { size: 23, fill: pal.muted, opacity: 0.85 })}
    `;
  },
};

export const neuronSignal: VisualComponent = {
  id: "neuron_signal",
  labelTr: "Nöron ve aksiyon potansiyeli",
  domains: ["biology"],
  mechanisms: ["neuron_signal"],
  concepts: ["neuron", "synapse", "ltp", "hippocampus", "cell_membrane"],
  incompatibleConcepts: ["tetrahedral_lattice", "black_hole", "tectonic_plate", "cleavage_plane"],
  scientificNote:
    "Aksiyon potansiyeli akson boyunca ilerleyen elektriksel bir dalgadır; sinaptik aralığa kimyasal iletim olur. Görsel, sinyalin yönünü ve hızını temsil eder.",
  params: [
    { name: "neuronLabel", type: "string", default: "nöron", desc: "Nöron etiketi" },
    { name: "axonLabel", type: "string", default: "akson", desc: "Akson etiketi" },
    { name: "signalLabel", type: "string", default: "sinyal", desc: "Sinyal etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const neuronLabel = str(params, "neuronLabel", "nöron");
    const axonLabel = str(params, "axonLabel", "akson");
    const signalLabel = str(params, "signalLabel", "sinyal");
    const soma = { x: 300, y: 840 };
    let dendrites = "";
    for (let i = 0; i < 6; i++) {
      const a = -1.9 + i * 0.65;
      const x2 = soma.x + Math.cos(a) * 170;
      const y2 = soma.y + Math.sin(a) * 170;
      dendrites += `<line x1="${soma.x}" y1="${soma.y}" x2="${n(x2)}" y2="${n(y2)}" stroke="${pal.accent}" stroke-width="5" opacity="0.6" stroke-linecap="round"/>`;
      dendrites += `<line x1="${n(x2)}" y1="${n(y2)}" x2="${n(x2 + Math.cos(a - 0.5) * 60)}" y2="${n(y2 + Math.sin(a - 0.5) * 60)}" stroke="${pal.accent}" stroke-width="3" opacity="0.45"/>`;
      dendrites += `<line x1="${n(x2)}" y1="${n(y2)}" x2="${n(x2 + Math.cos(a + 0.5) * 60)}" y2="${n(y2 + Math.sin(a + 0.5) * 60)}" stroke="${pal.accent}" stroke-width="3" opacity="0.45"/>`;
    }
    const axonY = 840;
    const axonStart = soma.x + 50;
    const axonEnd = 930;
    let myelin = "";
    for (let i = 0; i < 5; i++) {
      const x = axonStart + 40 + i * 110;
      myelin += `<rect x="${n(x)}" y="${axonY - 26}" width="80" height="52" rx="26" fill="rgba(255,209,102,0.22)" stroke="rgba(255,209,102,0.55)" stroke-width="1.5"/>`;
    }
    const p = (t * 0.55) % 1;
    const sigX = axonStart + (axonEnd - axonStart) * p;
    return `
      ${label(CX, 470, "SİNYAL NÖRON BOYUNCA İLERLER", { size: 25, fill: pal.muted, letterSpacing: 2 })}
      <line x1="${axonStart}" y1="${axonY}" x2="${axonEnd}" y2="${axonY}" stroke="${pal.accent}" stroke-width="10" opacity="0.35" stroke-linecap="round"/>
      ${myelin}
      ${dendrites}
      ${glow(soma.x, soma.y, 120, pal.accent, 0.25)}
      <circle cx="${soma.x}" cy="${soma.y}" r="62" fill="rgba(110,231,168,0.25)" stroke="${pal.accent}" stroke-width="3"/>
      <circle cx="${soma.x + 6}" cy="${soma.y - 4}" r="20" fill="rgba(150,241,200,0.35)"/>
      ${glow(sigX, axonY, 46, "#ffe9a8", 0.5)}
      ${dot(sigX, axonY, 15, "#ffe9a8", 1)}
      ${label(sigX, axonY - 52, signalLabel, { size: 21, fill: "#ffe9a8", opacity: 0.9 })}
      ${label(soma.x, soma.y + 130, neuronLabel, { size: 24, fill: "#c9f4dd" })}
      ${label(660, axonY + 80, axonLabel, { size: 23, fill: pal.accent2, opacity: 0.9 })}
      ${chip(900, 960, "miyelin kılıf", { color: pal.accent2, size: 20, fill: "rgba(30,22,6,0.8)" })}
      ${label(CX, 1180, "Miyelin kılıf iletimi hızlandırır", { size: 24, fill: pal.muted })}
      ${label(CX, 1260, "Sinyal kimyasal veya elektriksel olabilir", { size: 23, fill: pal.muted, opacity: 0.85 })}
      ${label(CX, 1340, "Nöronlar birbirine değmez: sinapslar vardır", { size: 23, fill: pal.muted, opacity: 0.8 })}
    `;
  },
};

export const synapseZoom: VisualComponent = {
  id: "synapse_zoom",
  labelTr: "Sinaps ve nörotransmitterler",
  domains: ["biology"],
  mechanisms: ["synapse_zoom"],
  concepts: ["synapse", "neurotransmitter", "cell_membrane", "neuron", "ltp"],
  incompatibleConcepts: ["tetrahedral_lattice", "black_hole", "tectonic_plate", "cleavage_plane"],
  scientificNote:
    "Nörotransmitterler sinaptik aralığa salınır ve karşı zarın reseptörlerine bağlanır. Bu kimyasal iletim, sinir sisteminin temel iletişim biçimidir.",
  params: [
    { name: "cleftLabel", type: "string", default: "sinaptik aralık", desc: "Aralık etiketi" },
    { name: "vesicleLabel", type: "string", default: "taşıyıcı", desc: "Vezikül etiketi" },
    { name: "receptorLabel", type: "string", default: "alıcı", desc: "Reseptör etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const cleftLabel = str(params, "cleftLabel", "sinaptik aralık");
    const vesicleLabel = str(params, "vesicleLabel", "taşıyıcı");
    const receptorLabel = str(params, "receptorLabel", "alıcı");
    const topY = 780;
    const botY = 980;
    let vesicles = "";
    for (let i = 0; i < 4; i++) {
      const x = 380 + i * 110;
      vesicles += circle(x, topY + 60, 34, { fill: "rgba(255,209,102,0.25)", stroke: "rgba(255,209,102,0.7)", strokeWidth: 2 });
      for (let k = 0; k < 4; k++) {
        vesicles += dot(x - 14 + (k % 2) * 26, topY + 50 + Math.floor(k / 2) * 22, 6, "#ffe9a8", 0.85);
      }
    }
    let released = "";
    for (let i = 0; i < 14; i++) {
      const p = ((t * 0.5 + i / 14) % 1);
      const x = 400 + rand(103, i) * 320 + Math.sin(p * 6 + i) * 12;
      const y = topY + 110 + p * (botY - topY - 110);
      released += dot(x, y, 5.5, "#ffe9a8", 1 - p * 0.25);
    }
    let receptors = "";
    for (let i = 0; i < 4; i++) {
      const x = 400 + i * 100;
      receptors += `<path d="M ${x - 14} ${botY} L ${x - 14} ${botY + 34} M ${x + 14} ${botY} L ${x + 14} ${botY + 34}" stroke="${pal.accent}" stroke-width="5" opacity="0.75"/>`;
    }
    return `
      ${label(CX, 470, "SİNAPS: KİMYASAL İLETİM", { size: 25, fill: pal.muted, letterSpacing: 3 })}
      <rect x="300" y="${topY - 60}" width="480" height="120" rx="40" fill="rgba(110,231,168,0.14)" stroke="rgba(150,241,200,0.5)" stroke-width="3"/>
      <rect x="300" y="${botY}" width="480" height="120" rx="40" fill="rgba(90,210,255,0.12)" stroke="rgba(120,225,255,0.5)" stroke-width="3"/>
      ${vesicles}
      ${released}
      ${receptors}
      ${chip(250, 560, vesicleLabel, { color: pal.accent2, size: 22, fill: "rgba(30,22,6,0.85)" })}
      ${chip(870, 640, cleftLabel, { color: pal.ink, size: 22, fill: "rgba(8,18,28,0.85)" })}
      ${chip(880, 1050, receptorLabel, { color: pal.accent, size: 22, fill: "rgba(6,20,28,0.85)" })}
      ${label(300, topY + 8, "salgılayan nöron", { size: 20, fill: "#c9f4dd", anchor: "start", opacity: 0.8 })}
      ${label(300, botY + 96, "alan nöron", { size: 20, fill: "#bde9ff", anchor: "start", opacity: 0.8 })}
      ${label(CX, 1250, "Nörotransmitterler reseptörlere bağlanır", { size: 24, fill: pal.muted })}
      ${label(CX, 1330, "Aralık çok küçüktür: ~20 nanometre", { size: 23, fill: pal.muted, opacity: 0.85 })}
    `;
  },
};

export const synapticPlasticity: VisualComponent = {
  id: "synaptic_plasticity",
  labelTr: "Sinaptik güçlenme ve budama",
  domains: ["biology"],
  mechanisms: ["synaptic_plasticity"],
  concepts: ["ltp", "synapse", "neurotransmitter", "synaptic_pruning", "neuron"],
  incompatibleConcepts: ["tetrahedral_lattice", "black_hole", "tectonic_plate", "cleavage_plane"],
  scientificNote:
    "Tekrarlı uyarım sinaptik bağlantıyı güçlendirir (LTP); kullanılmayan bağlantılar zayıflar (budama). Bu, öğrenme ve unutmanın hücresel temelidir.",
  params: [
    { name: "weakLabel", type: "string", default: "zayıf bağlantı", desc: "Zayıf etiketi" },
    { name: "strongLabel", type: "string", default: "güçlenmiş bağlantı", desc: "Güçlü etiketi" },
    { name: "repeatLabel", type: "string", default: "tekrar", desc: "Tekrar etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const weakLabel = str(params, "weakLabel", "zayıf bağlantı");
    const strongLabel = str(params, "strongLabel", "güçlenmiş bağlantı");
    const repeatLabel = str(params, "repeatLabel", "tekrar");
    const grow = easeInOut(seg(t, 0.6, 3.2));
    const panels = [
      { x: 80, strength: 0.18, label: weakLabel, color: pal.muted },
      { x: 570, strength: 0.18 + grow * 0.8, label: strongLabel, color: pal.accent },
    ];
    let svg = "";
    panels.forEach((p, k) => {
      svg += panel(p.x, 620, 430, 480, { fill: "rgba(8,20,16,0.55)", stroke: "rgba(150,241,200,0.16)" });
      svg += label(p.x + 215, 690, k === 0 ? "ÖNCE" : "SONRA", { size: 24, fill: p.color, letterSpacing: 3 });
      svg += circle(p.x + 215, 820, 52, { fill: "rgba(110,231,168,0.16)", stroke: p.color, strokeWidth: 2 });
      svg += circle(p.x + 215, 980, 52, { fill: "rgba(110,231,168,0.16)", stroke: p.color, strokeWidth: 2 });
      for (let i = 0; i < 4; i++) {
        const y = 860 + i * 22;
        const op = 0.25 + p.strength * 0.6;
        svg += `<line x1="${p.x + 235}" y1="845" x2="${p.x + 235}" y2="${y + 40}" stroke="${p.color}" stroke-width="${n(2 + p.strength * 7)}" opacity="${n(op)}"/>`;
      }
      // sinaptik aralıktaki nörotransmitterler: güçlendikçe artar
      const count = Math.round(3 + p.strength * 12);
      for (let i = 0; i < count; i++) {
        const px = p.x + 150 + rand(107, i + k * 20) * 130;
        const py = 880 + rand(109, i + k * 20) * 60 + Math.sin(t * 2 + i) * 6;
        svg += dot(px, py, 5, "#ffe9a8", 0.4 + p.strength * 0.55);
      }
      svg += chip(p.x + 215, 1060, p.label, { color: k === 0 ? pal.muted : pal.accent2, size: 21, fill: "rgba(8,18,14,0.85)" });
    });
    svg += arrow(510, 860, 560, 860, { color: pal.accent2, width: 4, opacity: 0.6 });
    svg += label(CX, 500, "TEKRAR EDEN SİNYAL BAĞI GÜÇLENDİRİR", { size: 25, fill: pal.muted, letterSpacing: 2 });
    svg += chip(CX, 1180, repeatLabel, { color: pal.accent2, size: 24, fill: "rgba(30,22,6,0.85)" });
    svg += label(CX, 1290, "Daha çok vezikül, daha çok reseptör, daha güçlü sinyal", { size: 23, fill: pal.muted });
    svg += label(CX, 1370, "Uzun süreli güçlenme = LTP", { size: 26, fill: pal.ink, opacity: 0.85 });
    return svg;
  },
};

export const brainRegions: VisualComponent = {
  id: "brain_regions",
  labelTr: "Beyin bölgeleri ve hipokampus",
  domains: ["biology"],
  mechanisms: ["brain_regions"],
  concepts: ["hippocampus", "neuron", "ltp", "synapse", "energy"],
  incompatibleConcepts: ["tetrahedral_lattice", "black_hole", "tectonic_plate", "cleavage_plane"],
  scientificNote:
    "Hipokampus, yeni bildirimsel anıların oluşumunda ve pekişmesinde rol oynar. Anılar tek bir bölgede depolanmaz; dağıtık kortikal ağlarda temsil edilir.",
  params: [
    { name: "brainLabel", type: "string", default: "beyin", desc: "Beyin etiketi" },
    { name: "hippoLabel", type: "string", default: "hipokampus", desc: "Hipokampus etiketi" },
    { name: "cortexLabel", type: "string", default: "korteks", desc: "Korteks etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const brainLabel = str(params, "brainLabel", "beyin");
    const hippoLabel = str(params, "hippoLabel", "hipokampus");
    const cortexLabel = str(params, "cortexLabel", "korteks");
    const pulseA = pulse(t, 2.2);
    const path =
      "M 300 1040 C 190 940 210 760 330 690 C 360 560 520 500 640 540 C 760 470 900 560 900 690 C 960 800 890 920 790 960 C 760 1060 640 1120 520 1090 C 430 1140 340 1120 300 1040 Z";
    const hippo =
      "M 470 900 C 520 860 610 870 640 920 C 660 970 600 1010 540 1000 C 490 990 450 950 470 900 Z";
    let trace = "";
    for (let i = 0; i < 4; i++) {
      const a = t * 0.4 + i;
      const x = 600 + Math.cos(a) * 150;
      const y = 760 + Math.sin(a) * 100;
      trace += dot(x, y, 4, pal.accent2, 0.4 + 0.3 * pulseA);
    }
    return `
      ${label(CX, 470, "BELLEK TEK BİR YERDE DEĞİL", { size: 25, fill: pal.muted, letterSpacing: 3 })}
      <path d="${path}" fill="rgba(110,231,168,0.10)" stroke="rgba(150,241,200,0.55)" stroke-width="4"/>
      <path d="M 340 760 C 420 700 520 700 600 740 M 380 880 C 460 820 560 820 640 860 M 700 640 C 760 700 780 800 760 880" fill="none" stroke="rgba(150,241,200,0.25)" stroke-width="2"/>
      <path d="${hippo}" fill="rgba(255,209,102,0.35)" stroke="${pal.accent2}" stroke-width="2.5"/>
      ${glow(555, 935, 110, "#ffd166", 0.2 + pulseA * 0.12)}
      ${trace}
      ${arrow(700, 940, 800, 840, { color: pal.accent, width: 2.5, opacity: 0.55 })}
      ${chip(820, 800, cortexLabel, { color: pal.accent, size: 21, fill: "rgba(6,20,28,0.85)" })}
      ${chip(300, 780, brainLabel, { color: "#c9f4dd", size: 22, fill: "rgba(4,20,12,0.85)" })}
      ${chip(420, 1080, hippoLabel, { color: pal.accent2, size: 22, fill: "rgba(30,22,6,0.9)" })}
      ${label(CX, 1250, "Hipokampus yeni anıları oluşturur", { size: 25, fill: pal.ink, opacity: 0.88 })}
      ${label(CX, 1330, "Uykuda anılar kortekse dağıtılır", { size: 23, fill: pal.muted })}
      ${label(CX, 1400, "Anı = değişen bağlantı örüntüsü", { size: 23, fill: pal.muted, opacity: 0.85 })}
    `;
  },
};
