import { arrow, chip, circle, clamp, dot, easeInOut, easeOut, glow, label, n, panel, pulse, rand, seg } from "../primitives.js";
import type { VisualComponent } from "./types.js";
import { str, num } from "./types.js";

const CX = 540;

export const plateMotion: VisualComponent = {
  id: "plate_motion",
  labelTr: "Tektonik levha hareketi",
  domains: ["geology", "earth"],
  mechanisms: ["plate_motion"],
  concepts: ["tectonic_plate", "plate_motion", "fault_line", "elastic_strain"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "neuron", "atp"],
  scientificNote:
    "Levhalar manto konveksiyonuyla yılda birkaç santimetre hareket eder. Bu hız insan ölçeğinde fark edilmez; jeolojik zaman ölçeğinde büyük yer değiştirmeler üretir.",
  params: [
    { name: "plateLabel", type: "string", default: "levha", desc: "Levha etiketi" },
    { name: "mantleLabel", type: "string", default: "manto", desc: "Manto etiketi" },
    { name: "arrowLabel", type: "string", default: "hareket", desc: "Hareket etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const plateLabel = str(params, "plateLabel", "levha");
    const mantleLabel = str(params, "mantleLabel", "manto");
    const arrowLabel = str(params, "arrowLabel", "hareket");
    const shift = easeInOut(seg(t, 0.2, 3.2)) * 34;
    let mantle = "";
    for (let i = 0; i < 5; i++) {
      const a = t * 0.5 + i * 1.2;
      const x = 200 + i * 170;
      const y = 1140 + Math.sin(a) * 16;
      mantle += `<path d="M ${x} ${y} q 40 ${Math.cos(a) * 26} 80 0" fill="none" stroke="${pal.accent3}" stroke-width="2" opacity="0.3"/>`;
      mantle += arrow(x + 4, y - 40, x + 30, y - 70, { color: pal.accent3, width: 2, opacity: 0.25, head: 7 });
    }
    return `
      ${label(CX, 470, "LEVHALAR YAVAŞÇA HAREKET EDER", { size: 27, fill: pal.muted, letterSpacing: 3 })}
      <rect x="30" y="720" width="1020" height="420" rx="18" fill="rgba(120,160,190,0.16)" stroke="rgba(200,230,255,0.2)" stroke-width="1.5"/>
      <path d="M 30 720 L ${n(CX - 20 - shift)} 720 L ${n(CX - 20 - shift)} 1140 L 30 1140 Z" fill="rgba(120,165,200,0.30)"/>
      <path d="M ${n(CX + 20 - shift * 0.25)} 720 L 1050 720 L 1050 1140 L ${n(CX + 20 - shift * 0.25)} 1140 Z" fill="rgba(90,130,165,0.30)"/>
      ${Array.from({ length: 5 }, (_, i) => `<line x1="60" y1="${790 + i * 68}" x2="${n(CX - 40 - shift)}" y2="${790 + i * 68}" stroke="rgba(220,240,255,0.10)" stroke-width="1.5"/>`).join("")}
      ${Array.from({ length: 5 }, (_, i) => `<line x1="${n(CX + 40)}" y1="${790 + i * 68}" x2="1020" y2="${790 + i * 68}" stroke="rgba(220,240,255,0.10)" stroke-width="1.5"/>`).join("")}
      <line x1="${n(CX - shift * 0.7)}" y1="720" x2="${n(CX - shift * 0.7)}" y2="1140" stroke="${pal.accent2}" stroke-width="4" stroke-dasharray="12 9" opacity="0.85"/>
      ${arrow(300, 960, 300 + 90 + shift, 960, { color: pal.accent, width: 6 })}
      ${arrow(790, 960, 700 - shift, 960, { color: pal.accent, width: 6 })}
      ${chip(300, 880, arrowLabel, { color: pal.accent, size: 23, fill: "rgba(6,20,28,0.85)" })}
      ${chip(220, 790, plateLabel, { color: pal.ink, size: 25, fill: "rgba(10,20,34,0.85)" })}
      ${chip(880, 790, plateLabel, { color: pal.ink, size: 25, fill: "rgba(10,20,34,0.85)" })}
      ${mantle}
      <rect x="30" y="1180" width="1020" height="190" rx="40" fill="rgba(90,40,20,0.20)"/>
      ${label(CX, 1250, mantleLabel, { size: 26, fill: "#ffb48a", opacity: 0.9 })}
      ${label(CX, 1330, "Konveksiyon levhaları sürükler · yılda birkaç santimetre", { size: 23, fill: pal.muted })}
    `;
  },
};

export const elasticStrain: VisualComponent = {
  id: "elastic_strain",
  labelTr: "Kilitli fayda elastik gerilme birikimi",
  domains: ["geology", "physics"],
  mechanisms: ["elastic_strain"],
  concepts: ["fault_line", "elastic_strain", "mechanical_stress", "plate_motion", "rupture"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "atp", "neuron"],
  scientificNote:
    "Kilitli fay segmentinde levha hareketi sürerken kaya elastik olarak deforme olur ve gerilme enerjisi birikir. Bu birikim kaya dayanımını aştığında kırılma olur.",
  params: [
    { name: "faultLabel", type: "string", default: "fay hattı", desc: "Fay etiketi" },
    { name: "strainLabel", type: "string", default: "biriken gerilme", desc: "Gerilme etiketi" },
    { name: "lockedLabel", type: "string", default: "kilitli", desc: "Kilit etiketi" },
    { name: "progress", type: "number", default: 0, desc: "0-1 arası birikim (varsayılan: zamana bağlı)" },
  ],
  render: ({ t, params, pal }) => {
    const faultLabel = str(params, "faultLabel", "fay hattı");
    const strainLabel = str(params, "strainLabel", "biriken gerilme");
    const lockedLabel = str(params, "lockedLabel", "kilitli");
    const p = num(params, "progress", 0) || clamp(seg(t, 0.2, 4.5));
    let grid = "";
    for (let i = 0; i <= 9; i++) {
      const y = 620 + i * 68;
      const shear = (i - 4.5) * 10 * p;
      grid += `<line x1="${n(140 + shear)}" y1="${y}" x2="${n(940 + shear)}" y2="${y}" stroke="rgba(160,200,225,0.22)" stroke-width="1.4"/>`;
    }
    for (let i = 0; i <= 11; i++) {
      const x = 150 + i * 68;
      const shear = ((i - 5.5) / 5.5) * 46 * p;
      grid += `<line x1="${n(x - shear * 0.4)}" y1="600" x2="${n(x + shear)}" y2="1240" stroke="rgba(160,200,225,0.16)" stroke-width="1.2"/>`;
    }
    const bars = 5;
    let strainBar = "";
    for (let i = 0; i < bars; i++) {
      const active = p * bars > i;
      strainBar += `<rect x="${n(140 + i * 62)}" y="470" width="48" height="26" rx="8" fill="${active ? pal.accent2 : "rgba(255,255,255,0.12)"}" opacity="${active ? 0.95 : 0.6}"/>`;
    }
    return `
      ${label(CX, 470, "FAY KİLİTLİ: KAYA ESKİR", { size: 27, fill: pal.muted, letterSpacing: 3 })}
      <rect x="130" y="590" width="820" height="660" rx="20" fill="rgba(10,20,32,0.5)" stroke="rgba(255,255,255,0.08)"/>
      <g clip-path="url(#roundClip)">${grid}</g>
      <line x1="150" y1="940" x2="930" y2="900" stroke="${pal.accent2}" stroke-width="5" stroke-dasharray="16 10" opacity="0.9"/>
      ${chip(260, 1010, faultLabel, { color: pal.accent2, size: 24, fill: "rgba(30,20,8,0.85)" })}
      ${chip(800, 1090, lockedLabel, { color: "#ffb0a0", size: 22, fill: "rgba(34,14,10,0.85)" })}
      ${strainBar}
      ${label(350, 530, strainLabel, { size: 24, fill: pal.ink, opacity: 0.85 })}
      ${arrow(600, 1180, 700, 1150, { color: pal.accent, width: 3, opacity: 0.5 })}
      ${label(CX, 1330, "Levha hareket eder, fay kaymaz: enerji depolanır", { size: 24, fill: pal.muted })}
    `;
  },
};

export const faultRupture: VisualComponent = {
  id: "fault_rupture",
  labelTr: "Fay kırılması ve sarsıntı",
  domains: ["geology", "physics"],
  mechanisms: ["fault_rupture"],
  concepts: ["rupture", "seismic_wave", "fault_line", "elastic_strain", "energy", "mechanical_stress"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "atp", "neuron"],
  scientificNote:
    "Gerilme kaya dayanımını aştığında fay aniden kırılır ve kayar. Depolanan elastik enerji sismik dalgalara dönüşür. Bu, elastik geri sıçrama (elastic rebound) modelidir.",
  params: [
    { name: "ruptureLabel", type: "string", default: "kırılma", desc: "Kırılma etiketi" },
    { name: "hypocenterLabel", type: "string", default: "odak", desc: "Odak etiketi" },
    { name: "waveLabel", type: "string", default: "sismik dalga", desc: "Dalga etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const ruptureLabel = str(params, "ruptureLabel", "kırılma");
    const hypocenterLabel = str(params, "hypocenterLabel", "odak");
    const waveLabel = str(params, "waveLabel", "sismik dalga");
    const breakT = 1.1;
    const broken = t > breakT;
    const shake = broken ? Math.exp(-(t - breakT) * 1.6) * 12 : 0;
    const sx = CX + Math.sin(t * 40) * shake;
    const sy = 880 + Math.cos(t * 33) * shake;
    const slip = easeOut(seg(t, breakT, breakT + 0.5)) * 40;
    let waves = "";
    if (broken) {
      for (let i = 0; i < 4; i++) {
        const p = clamp((t - breakT - i * 0.25) / 2.4);
        if (p <= 0) continue;
        waves += circle(sx, sy, 60 + p * 520, { stroke: pal.accent, strokeWidth: 3 - i * 0.4, opacity: (1 - p) * 0.5 });
      }
    }
    const gridLines: string[] = [];
    for (let i = 0; i <= 8; i++) {
      const y = 640 + i * 76;
      const off = i < 4 ? -slip : slip;
      if (broken && Math.abs(y - 900) < 80) gridLines.push(`<line x1="140" y1="${n(y + off)}" x2="480" y2="${n(y + off)}" stroke="rgba(200,220,240,0.3)" stroke-width="1.6"/>`);
      else gridLines.push(`<line x1="140" y1="${n(y)}" x2="940" y2="${n(y)}" stroke="rgba(200,220,240,0.22)" stroke-width="1.4"/>`);
    }
    return `
      ${label(CX, 470, "GERİLME DAYANIMI AŞAR: FAY KIRILIR", { size: 26, fill: pal.muted, letterSpacing: 2 })}
      <rect x="120" y="600" width="840" height="640" rx="20" fill="rgba(10,20,32,0.5)" stroke="rgba(255,255,255,0.08)"/>
      ${gridLines.join("")}
      <line x1="${n(240 + slip)}" y1="900" x2="940" y2="900" stroke="${broken ? "#ff8a5c" : pal.accent2}" stroke-width="5" stroke-dasharray="14 10"/>
      ${broken ? `<polyline points="${n(sx - 30)},${n(sy)} ${n(sx - 10)},${n(sy - 20)} ${n(sx + 12)},${n(sy + 14)} ${n(sx + 34)},${n(sy - 8)}" fill="none" stroke="#ffffff" stroke-width="4"/>` : ""}
      ${glow(sx, sy, broken ? 90 : 40, broken ? "#ff8a5c" : pal.accent2, 0.3)}
      ${dot(sx, sy, 10, broken ? "#ffd166" : pal.accent2, 0.95)}
      ${waves}
      ${chip(sx, sy + 100, hypocenterLabel, { color: pal.ink, size: 22, fill: "rgba(10,18,28,0.85)" })}
      ${broken ? chip(CX, 560, ruptureLabel, { color: "#ffd3b0", size: 26, fill: "rgba(36,14,8,0.9)", stroke: "rgba(255,140,90,0.4)" }) : ""}
      ${chip(800, 1180, waveLabel, { color: pal.accent, size: 22, fill: "rgba(6,20,28,0.85)" })}
      ${label(CX, 1310, "Açığa çıkan enerji sismik dalgalara dönüşür", { size: 24, fill: pal.muted })}
    `;
  },
};

export const seismicWaves: VisualComponent = {
  id: "seismic_waves",
  labelTr: "Sismik dalgaların yayılımı",
  domains: ["geology", "earth", "physics"],
  mechanisms: ["seismic_waves"],
  concepts: ["seismic_wave", "energy", "rupture", "fault_line", "mechanical_stress"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "atp", "neuron"],
  scientificNote:
    "P dalgaları boyuna, S dalgaları enine yayılır; S dalgaları sıvılarda ilerlemez. Yüzey dalgaları en çok hasara yol açar. Görsel, dalga türlerini şematik olarak ayırır.",
  params: [
    { name: "pLabel", type: "string", default: "P dalgası", desc: "P dalgası etiketi" },
    { name: "sLabel", type: "string", default: "S dalgası", desc: "S dalgası etiketi" },
    { name: "surfaceLabel", type: "string", default: "yüzey dalgası", desc: "Yüzey dalgası etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const pLabel = str(params, "pLabel", "P dalgası");
    const sLabel = str(params, "sLabel", "S dalgası");
    const surfaceLabel = str(params, "surfaceLabel", "yüzey dalgası");
    const hyp = { x: CX, y: 1120 };
    let rings = "";
    for (let i = 0; i < 5; i++) {
      const p = ((t * 0.32 + i / 5) % 1);
      rings += circle(hyp.x, hyp.y, 40 + p * 620, { stroke: pal.accent, strokeWidth: 2.5, opacity: (1 - p) * 0.35 });
      rings += circle(hyp.x, hyp.y, 30 + p * 460, { stroke: pal.accent2, strokeWidth: 2, opacity: (1 - p) * 0.4 });
    }
    // yüzey dalgası
    const waveY = 760;
    let surf = "";
    for (let i = 0; i < 2; i++) {
      const off = t * 90 + i * 40;
      let d = "";
      for (let k = 0; k <= 60; k++) {
        const x = 60 + k * 16;
        const y = waveY + Math.sin((x + off) / 42) * 16 - off * 0.02;
        d += `${k === 0 ? "M" : "L"} ${n(x)} ${n(y)} `;
      }
      surf += `<path d="${d}" fill="none" stroke="#ffb35c" stroke-width="2.4" opacity="0.5"/>`;
    }
    const buildingX = 830;
    const buildingShake = Math.sin(t * 9) * 8;
    return `
      ${label(CX, 470, "ODAKTAN HER YÖNE DALGALAR", { size: 27, fill: pal.muted, letterSpacing: 3 })}
      <rect x="40" y="740" width="1000" height="70" fill="rgba(90,120,150,0.22)"/>
      ${surf}
      ${rings}
      <polygon points="${hyp.x - 14},${hyp.y} ${hyp.x + 14},${hyp.y} ${hyp.x},${hyp.y - 26}" fill="#ff8a5c"/>
      ${label(hyp.x, hyp.y + 60, "odak", { size: 22, fill: pal.muted })}
      <rect x="${n(buildingX + buildingShake)}" y="600" width="90" height="140" fill="rgba(200,220,240,0.22)" stroke="rgba(220,235,255,0.5)" stroke-width="1.5"/>
      ${Array.from({ length: 4 }, (_, i) => `<line x1="${n(buildingX + buildingShake)}" y1="${n(640 + i * 30)}" x2="${n(buildingX + buildingShake + 90)}" y2="${n(640 + i * 30)}" stroke="rgba(220,235,255,0.35)" stroke-width="1"/>`).join("")}
      ${chip(230, 560, pLabel, { color: pal.accent, size: 22, fill: "rgba(6,20,28,0.85)" })}
      ${chip(430, 620, sLabel, { color: pal.accent2, size: 22, fill: "rgba(28,20,6,0.85)" })}
      ${chip(760, 500, surfaceLabel, { color: "#ffb35c", size: 22, fill: "rgba(30,16,6,0.85)" })}
      ${label(CX, 1320, "Yüzey dalgaları en çok hasarı yapar", { size: 24, fill: pal.muted })}
      ${label(CX, 1390, "P ve S dalgaları farklı hızlarda ilerler", { size: 22, fill: pal.muted, opacity: 0.8 })}
    `;
  },
};
