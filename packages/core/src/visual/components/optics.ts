import { W, arrow, chip, circle, clamp, dot, easeInOut, easeOut, glow, label, n, panel, pulse, rand, seg } from "../primitives.js";
import type { VisualComponent } from "./types.js";
import { str } from "./types.js";

const CX = 540;
const CY = 850;

const COLORS = ["#ff4d6d", "#ff9f43", "#ffe066", "#63e6a8", "#5ad2ff", "#7a8cff", "#c77dff"];
const RAY_ANGLES = [-0.34, -0.23, -0.12, -0.01, 0.1, 0.21, 0.32];

export const spectrumSplit: VisualComponent = {
  id: "spectrum_split",
  labelTr: "Beyaz ışığın tayfa ayrılması",
  domains: ["physics", "earth"],
  mechanisms: ["spectrum_split"],
  concepts: ["sunlight", "spectrum", "light", "wavelength", "photon"],
  incompatibleConcepts: ["cell", "mitochondrion", "tectonic_plate", "atp"],
  scientificNote:
    "Beyaz ışık farklı dalga boylarının karışımıdır. Prizma, kırılma indisi dalga boyuna bağlı olduğu için renkleri ayırır. Bu, atmosferdeki saçılmadan farklı bir olaydır.",
  params: [
    { name: "startLabel", type: "string", default: "güneş ışığı", desc: "Giriş etiketi" },
    { name: "spectrumLabel", type: "string", default: "görünür tayf", desc: "Tayf etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const startLabel = str(params, "startLabel", "güneş ışığı");
    const spectrumLabel = str(params, "spectrumLabel", "görünür tayf");
    const spread = easeInOut(seg(t, 0.35, 2.0));
    const beam = pulse(t, 1.4);

    const prism = { x: 500, y: 790, size: 340 };
    let rays = "";
    RAY_ANGLES.forEach((a, i) => {
      const len = (380 + i * 11) * spread;
      const x2 = prism.x + Math.cos(a) * len;
      const y2 = prism.y + 40 + Math.sin(a) * len;
      rays += `<line x1="${n(prism.x + 40)}" y1="${n(prism.y + 20)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${COLORS[i]}" stroke-width="10" opacity="${n(0.85 * spread)}" stroke-linecap="round" filter="url(#soft2)"/>`;
      rays += `<line x1="${n(prism.x + 40)}" y1="${n(prism.y + 20)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${COLORS[i]}" stroke-width="4" opacity="${n(0.95 * spread)}" stroke-linecap="round"/>`;
      const px = prism.x + 40 + (x2 - prism.x - 40) * 0.62;
      const py = prism.y + 20 + (y2 - prism.y - 20) * 0.62;
      if (spread > 0.5) rays += dot(px, py, 5, COLORS[i], 0.9);
    });

    return `
      ${glow(180, 700, 150, "#ffe9b0", 0.16)}
      ${circle(180, 700, 62, { fill: "#fff6d8", opacity: 0.95 })}
      ${circle(180, 700, 92, { fill: "#ffe9b0", opacity: 0.12 })}
      ${label(180, 810, startLabel, { size: 26, fill: pal.muted })}
      ${`<line x1="250" y1="712" x2="${prism.x - 20}" y2="${n(prism.y - 10)}" stroke="#ffffff" stroke-width="12" opacity="${n(0.18 + beam * 0.22)}" filter="url(#soft2)"/><line x1="250" y1="712" x2="${prism.x - 20}" y2="${n(prism.y - 10)}" stroke="#ffffff" stroke-width="5" opacity="0.9"/>`}
      <polygon points="${prism.x},${prism.y - prism.size * 0.5} ${prism.x - prism.size * 0.5},${prism.y + prism.size * 0.52} ${prism.x + prism.size * 0.5},${prism.y + prism.size * 0.52}" fill="rgba(180,225,255,0.10)" stroke="rgba(200,240,255,0.55)" stroke-width="3"/>
      ${rays}
      ${spread > 0.35 ? panel(CX - 190, 1150, 380, 86, { fill: "rgba(8,14,24,0.62)", rx: 40 }) : ""}
      ${spread > 0.35 ? label(CX, 1204, spectrumLabel, { size: 30, fill: pal.ink, opacity: spread }) : ""}
      ${label(CX, 470, "BEYAZ IŞIK = TÜM RENKLER", { size: 28, fill: pal.muted, letterSpacing: 4 })}
      ${label(CX, 1290, "Prizma renkleri ayırır; saçılma farklı bir olaydır", { size: 24, fill: pal.muted, opacity: 0.8 })}
    `;
  },
};

export const rayleighScattering: VisualComponent = {
  id: "rayleigh_scattering",
  labelTr: "Rayleigh saçılması (moleküller)",
  domains: ["physics", "earth", "chemistry"],
  mechanisms: ["rayleigh_scattering", "sky_dome_view"],
  concepts: ["atmosphere", "gas_molecule", "rayleigh_scattering", "photon", "wavelength", "spectrum", "observer", "sunlight", "light"],
  incompatibleConcepts: ["cell", "mitochondrion", "tectonic_plate", "covalent_bond", "tetrahedral_lattice"],
  scientificNote:
    "Rayleigh saçılmasında şiddet 1/λ⁴ ile orantılıdır. Mavi ışık (~450 nm) kırmızıya (~700 nm) göre yaklaşık 5-6 kat daha fazla saçılır. Moleküller ışığı soğurmaz; yönünü değiştirir.",
  params: [
    { name: "moleculeLabel", type: "string", default: "N₂ / O₂", desc: "Molekül etiketi" },
    { name: "incidentLabel", type: "string", default: "güneş ışığı", desc: "Gelen ışık" },
    { name: "scatteredLabel", type: "string", default: "saçılan ışık", desc: "Saçılan ışık" },
  ],
  render: ({ t, params, pal }) => {
    const moleculeLabel = str(params, "moleculeLabel", "N₂ / O₂");
    const incidentLabel = str(params, "incidentLabel", "güneş ışığı");
    const scatteredLabel = str(params, "scatteredLabel", "saçılan ışık");
    const mx = 570;
    const my = 900;

    const mols: [number, number][] = [
      [mx, my],
      [mx - 235, my - 155],
      [mx + 235, my - 130],
      [mx + 150, my + 195],
      [mx - 175, my + 185],
    ];
    let molecules = "";
    mols.forEach(([x, y], i) => {
      const bob = Math.sin(t * 1.5 + i) * 6;
      const r = i === 0 ? 1.25 : 1;
      const a1 = r * 20;
      const a2 = r * 15;
      molecules += `<line x1="${n(x - a1)}" y1="${n(y + bob)}" x2="${n(x + a1)}" y2="${n(y + bob)}" stroke="rgba(190,180,255,0.75)" stroke-width="${n(3.5 * r)}"/>`;
      molecules += `<circle cx="${n(x - a1)}" cy="${n(y + bob)}" r="${n(15 * r)}" fill="#8f7dff" stroke="#cfc6ff" stroke-width="1.5"/>`;
      molecules += `<circle cx="${n(x + a1)}" cy="${n(y + bob)}" r="${n(15 * r)}" fill="#8f7dff" stroke="#cfc6ff" stroke-width="1.5"/>`;
      molecules += circle(x, y + bob, 44 * r, { stroke: "rgba(157,140,255,0.22)", strokeWidth: 1.2, dash: "4 10" });
    });

    let photons = "";
    for (let i = 0; i < 34; i++) {
      const src = mols[i % mols.length];
      const a = rand(3, i) * Math.PI * 2;
      const speed = 0.2 + rand(7, i) * 0.22;
      const p = (t * speed + rand(11, i)) % 1;
      const dist = p * 560;
      const sx = src[0] + Math.cos(a) * dist;
      const sy = src[1] + Math.sin(a) * dist;
      const alpha = (1 - p) * 0.9;
      photons += `<line x1="${n(src[0] + Math.cos(a) * (dist - 34))}" y1="${n(src[1] + Math.sin(a) * (dist - 34))}" x2="${n(sx)}" y2="${n(sy)}" stroke="#5ad2ff" stroke-width="2" opacity="${n(alpha * 0.35)}"/>`;
      photons += dot(sx, sy, 6.2 - p * 2, "#8fd8ff", alpha);
    }

    const inP = (t * 0.7) % 1;
    const start = { x: 250, y: 620 };
    const end = { x: mx - 60, y: my - 60 };
    const inX = start.x + (end.x - start.x) * inP;
    const inY = start.y + (end.y - start.y) * inP;
    const redP = (t * 0.3) % 1;
    return `
      ${glow(150, 560, 120, "#ffe9b0", 0.2)}
      ${circle(150, 560, 58, { fill: "#fff6d8", opacity: 0.96 })}
      ${label(150, 660, "güneş", { size: 24, fill: pal.muted })}
      <line x1="200" y1="590" x2="${n(end.x)}" y2="${n(end.y)}" stroke="#ffffff" stroke-width="9" opacity="0.16" filter="url(#soft2)"/>
      <line x1="200" y1="590" x2="${n(end.x)}" y2="${n(end.y)}" stroke="#ffffff" stroke-width="4.5" opacity="0.85"/>
      ${dot(inX, inY, 10, "#ffffff", 1)}
      ${chip(330, 545, incidentLabel, { color: "#ffffff", size: 23, fill: "rgba(10,18,28,0.8)" })}
      ${molecules}
      ${photons}
      ${chip(mx, my - 245, moleculeLabel, { color: "#cfc6ff", size: 26, fill: "rgba(24,18,48,0.85)", stroke: "rgba(157,140,255,0.35)" })}
      ${arrow(700, 1080, 810, 1180, { color: "#5ad2ff", width: 3, opacity: 0.55 })}
      ${panel(700, 1190, 320, 76, { fill: "rgba(8,14,24,0.72)", rx: 36 })}
      ${label(860, 1240, scatteredLabel, { size: 24, fill: "#8fdcff" })}
      <line x1="250" y1="1010" x2="${n(250 + 470 * redP)}" y2="${n(1010 + 250 * redP)}" stroke="#ff6b6b" stroke-width="4.5" opacity="0.5"/>
      ${dot(250 + 470 * redP, 1010 + 250 * redP, 8, "#ff6b6b", 0.85)}
      ${label(250, 1280, "kırmızı ışık daha az saçılır", { size: 21, fill: "#ff9d9d", anchor: "start", opacity: 0.85 })}
      ${label(CX, 1350, "Işık moleküllerle her yöne dağılır", { size: 24, fill: pal.muted })}
    `;
  },
};

export const wavelengthScale: VisualComponent = {
  id: "wavelength_scale",
  labelTr: "Dalga boyu ve saçılma şiddeti (1/λ⁴)",
  domains: ["physics"],
  mechanisms: ["wavelength_scale"],
  concepts: ["wavelength", "rayleigh_scattering", "spectrum", "photon", "sunlight", "light"],
  incompatibleConcepts: ["cell", "mitochondrion", "tectonic_plate", "atp"],
  scientificNote:
    "Rayleigh saçılmasında şiddet dalga boyunun dördüncü kuvvetiyle ters orantılıdır. 450 nm ile 700 nm arasında yaklaşık 5,9 kat fark vardır.",
  params: [
    { name: "blueLabel", type: "string", default: "mavi ≈ 450 nm", desc: "Mavi etiket" },
    { name: "redLabel", type: "string", default: "kırmızı ≈ 700 nm", desc: "Kırmızı etiket" },
  ],
  render: ({ t, params, pal }) => {
    const blueLabel = str(params, "blueLabel", "mavi ≈ 450 nm");
    const redLabel = str(params, "redLabel", "kırmızı ≈ 700 nm");
    const grow = easeOut(seg(t, 0.4, 1.8));
    const wave = (x0: number, x1: number, y: number, lambda: number, color: string, amp: number) => {
      let d = "";
      const steps = 160;
      for (let i = 0; i <= steps; i++) {
        const x = x0 + ((x1 - x0) * i) / steps;
        const yy = y + Math.sin(((x - x0) / lambda) * Math.PI * 2) * amp;
        d += `${i === 0 ? "M" : "L"} ${n(x)} ${n(yy)} `;
      }
      return `<path d="${d}" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/><line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${color}" stroke-width="1" opacity="0.18"/>`;
    };
    const barBase = 1330;
    const blueH = 230 * grow;
    const redH = 40 * grow;
    return `
      ${label(CX, 470, "SAÇILMA ŞİDDETİ ∝ 1 / λ⁴", { size: 30, fill: pal.ink, letterSpacing: 1 })}
      ${panel(80, 540, 920, 860, { fill: "rgba(8,16,26,0.45)", stroke: "rgba(255,255,255,0.07)" })}
      ${label(150, 640, "MAVİ", { size: 27, fill: "#6fd4ff", anchor: "start", letterSpacing: 4 })}
      ${label(930, 640, blueLabel, { size: 22, fill: "#9fe0ff", anchor: "end" })}
      ${wave(150, 900, 730, 78, "#6fd4ff", 26)}
      ${label(150, 850, "KIRMIZI", { size: 27, fill: "#ff8a8a", anchor: "start", letterSpacing: 4 })}
      ${label(930, 850, redLabel, { size: 22, fill: "#ffb3b3", anchor: "end" })}
      ${wave(150, 900, 940, 150, "#ff8a8a", 20)}
      <rect x="200" y="${n(barBase - blueH)}" width="150" height="${n(blueH)}" rx="14" fill="#6fd4ff" opacity="0.9"/>
      <rect x="640" y="${n(barBase - redH)}" width="150" height="${n(redH)}" rx="14" fill="#ff8a8a" opacity="0.9"/>
      ${label(275, barBase + 48, "çok saçılır", { size: 21, fill: "#9fe0ff" })}
      ${label(715, barBase + 48, "az saçılır", { size: 22, fill: "#ffb3b3" })}
      ${label(CX, 1270, "KISA DALGA BOYU → DAHA GÜÇLÜ SAÇILMA", { size: 22, fill: pal.muted, letterSpacing: 1 })}
      ${label(CX, 1330, "Mavi ışık gökyüzünün her yönünden gelir", { size: 24, fill: pal.ink, opacity: 0.85 })}
    `;
  },
};

export const atmospherePath: VisualComponent = {
  id: "atmosphere_path",
  labelTr: "Atmosferde uzun yol (gün batımı)",
  domains: ["earth", "physics"],
  mechanisms: ["atmosphere_path"],
  concepts: ["horizon_path", "wavelength", "atmosphere", "sunlight", "rayleigh_scattering", "observer", "spectrum"],
  incompatibleConcepts: ["cell", "mitochondrion", "tectonic_plate", "atp"],
  scientificNote:
    "Güneş ufka yakınken ışık atmosferde çok daha uzun yol alır. Mavi bileşen yolda saçılıp dağılır; doğrudan gelen ışık kırmızı-turuncu görünür.",
  params: [
    { name: "lowSunLabel", type: "string", default: "ufuktaki güneş", desc: "Alçak güneş" },
    { name: "longPathLabel", type: "string", default: "uzun yol", desc: "Yol etiketi" },
    { name: "redLabel", type: "string", default: "kırmızı", desc: "Kırmızı etiket" },
  ],
  render: ({ t, params, pal }) => {
    const lowSunLabel = str(params, "lowSunLabel", "ufuktaki güneş");
    const longPathLabel = str(params, "longPathLabel", "uzun yol");
    const redLabel = str(params, "redLabel", "kırmızı");
    const horizon = 1120;
    const sunX = 150;
    const sunY = 900;
    const obsX = 880;
    const obsY = horizon - 40;
    const p = easeInOut(seg(t, 0.3, 2.2));

    // güneşten gözlemciye uzun atmosfer yolu (yay)
    let beam = "";
    for (let i = 0; i < 10; i++) {
      const f = i / 9;
      const color = f < 0.45 ? "#5ad2ff" : f < 0.75 ? "#ffd166" : "#ff8a5c";
      const midY = 640 - 40 * Math.sin(f * Math.PI);
      const x = sunX + 55 + (obsX - sunX - 55) * f;
      const y = sunY - 20 + (obsY - sunY + 20) * f - Math.sin(f * Math.PI) * 120;
      const nextX = sunX + 55 + (obsX - sunX - 55) * Math.min(1, f + 0.11);
      const nextY = sunY - 20 + (obsY - sunY + 20) * Math.min(1, f + 0.11) - Math.sin(Math.min(1, f + 0.11) * Math.PI) * 120;
      beam += `<line x1="${n(x)}" y1="${n(y)}" x2="${n(nextX)}" y2="${n(nextY)}" stroke="${color}" stroke-width="10" opacity="${n(0.16 + 0.1 * p)}" filter="url(#soft2)"/>`;
      beam += `<line x1="${n(x)}" y1="${n(y)}" x2="${n(nextX)}" y2="${n(nextY)}" stroke="${color}" stroke-width="5.5" opacity="${n(0.6 + 0.35 * p)}"/>`;
      if (i === 6) beam += label(x, y - 30, longPathLabel, { size: 23, fill: pal.accent2 });
      void midY;
    }
    let scatter = "";
    for (let i = 0; i < 44; i++) {
      const q = (t * 0.3 + rand(5, i)) % 1;
      const x = 280 + rand(9, i) * 500;
      const y = 820 + rand(13, i) * 250 - q * 200;
      scatter += dot(x, y, 3.6, "#5ad2ff", (1 - q) * 0.55);
      if (i % 7 === 0) scatter += arrow(x, y, x + 30, y - 90, { color: "#5ad2ff", width: 1.6, opacity: (1 - q) * 0.35, head: 7 });
    }
    return `
      ${label(CX, 470, "UFUKTAKİ GÜNEŞ: ATMOSFERDE UZUN YOL", { size: 24, fill: pal.muted, letterSpacing: 1 })}
      <rect x="0" y="${horizon}" width="1080" height="${1920 - horizon}" fill="#061722"/>
      <rect x="0" y="620" width="1080" height="${horizon - 620}" fill="rgba(18,60,82,0.35)"/>
      <line x1="0" y1="${horizon}" x2="1080" y2="${horizon}" stroke="rgba(180,230,255,0.4)" stroke-width="2"/>
      ${glow(sunX, sunY, 170, "#ffcf8a", 0.25)}
      ${circle(sunX, sunY, 60, { fill: "#ffe6b0", opacity: 0.96 })}
      ${label(sunX + 6, sunY + 108, lowSunLabel, { size: 22, fill: pal.muted })}
      <line x1="${sunX}" y1="${horizon}" x2="${sunX}" y2="${sunY + 60}" stroke="rgba(255,220,170,0.25)" stroke-width="2" stroke-dasharray="4 8"/>
      ${beam}
      ${scatter}
      ${glow(obsX, obsY, 80, "#ff9d6b", 0.28)}
      ${dot(obsX, obsY, 18, "#ffd9b0", 0.97)}
      ${label(obsX + 4, obsY + 58, "gözlemci", { size: 22, fill: pal.muted })}
      ${chip(560, 1060, redLabel, { color: "#ffb887", size: 27, fill: "rgba(34,14,8,0.88)", stroke: "rgba(255,150,100,0.35)" })}
      ${arrow(600, 1030, 700, 990, { color: "#ff8a5c", width: 3, opacity: 0.7 })}
      ${label(CX, 1290, "Mavi ışık yolda saçılır, kırmızı doğrudan gelir", { size: 24, fill: pal.ink, opacity: 0.85 })}
      ${label(CX, 1370, "Bu yüzden gün batımı kızıldır", { size: 23, fill: pal.muted })}
    `;
  },
};
