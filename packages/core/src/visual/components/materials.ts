import { W, clamp, dot, easeInOut, easeOut, esc, glow, label, n, panel, pulse, rand, seg, project3D, circle, arrow, chip } from "../primitives.js";
import type { VisualComponent } from "./types.js";
import { str, num } from "./types.js";

const CX = 540;
const CY = 890;

type Pt = { x: number; y: number; z: number };

/** Dörtyüzlü yönleri: elmasın karbon bağlanma geometrisi. */
const TETRA: Pt[] = [
  { x: 1, y: 1, z: 1 },
  { x: 1, y: -1, z: -1 },
  { x: -1, y: 1, z: -1 },
  { x: -1, y: -1, z: 1 },
];

/** Merkezden başlayarak dörtyüzlü ağ kümeler. */
function buildCluster(depth: number, bondLen = 1): Pt[] {
  const pts: Pt[] = [{ x: 0, y: 0, z: 0 }];
  const seen = new Set<string>(["0,0,0"]);
  let frontier: Pt[] = [{ x: 0, y: 0, z: 0 }];
  for (let d = 0; d < depth; d++) {
    const next: Pt[] = [];
    for (const base of frontier) {
      for (const dir of TETRA) {
        const len = Math.hypot(dir.x, dir.y, dir.z) || 1;
        const p = {
          x: base.x + (dir.x / len) * bondLen,
          y: base.y + (dir.y / len) * bondLen,
          z: base.z + (dir.z / len) * bondLen,
        };
        const key = `${p.x.toFixed(3)},${p.y.toFixed(3)},${p.z.toFixed(3)}`;
        if (!seen.has(key)) {
          seen.add(key);
          pts.push(p);
          next.push(p);
        }
      }
    }
    frontier = next;
  }
  return pts;
}

function rotY(p: Pt, a: number): Pt {
  return { x: p.x * Math.cos(a) + p.z * Math.sin(a), y: p.y, z: -p.x * Math.sin(a) + p.z * Math.cos(a) };
}

function bondsOf(pts: Pt[], maxDist: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y, pts[i].z - pts[j].z);
      if (d <= maxDist) out.push([i, j, d]);
    }
  }
  return out;
}

const CLUSTER = buildCluster(2, 1.15);
const BONDS = bondsOf(CLUSTER, 1.3);

export const crystalLattice: VisualComponent = {
  id: "crystal_lattice",
  labelTr: "Kristal örgü (dörtyüzlü karbon ağı)",
  domains: ["materials", "chemistry", "physics"],
  mechanisms: ["crystal_lattice"],
  concepts: ["carbon_atom", "covalent_bond", "tetrahedral_lattice", "hardness", "mechanical_stress"],
  incompatibleConcepts: ["cell", "mitochondrion", "neuron", "chloroplast"],
  scientificNote:
    "Elmas, her karbon atomunun dört komşusuna kovalent bağla bağlandığı dörtyüzlü bir ağdır. Görsel, bu bağlanma geometrisini temsil eder; ölçekli atom modeli değildir.",
  params: [
    { name: "atomLabel", type: "string", default: "karbon", desc: "Atom etiketi" },
    { name: "bondLabel", type: "string", default: "kovalent bağ", desc: "Bağ etiketi" },
    { name: "latticeLabel", type: "string", default: "dörtyüzlü örgü", desc: "Örgü etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const atomLabel = str(params, "atomLabel", "karbon");
    const bondLabel = str(params, "bondLabel", "kovalent bağ");
    const latticeLabel = str(params, "latticeLabel", "dörtyüzlü örgü");
    const angle = t * 0.32 + 0.4;
    const scale = 152;
    const appear = easeOut(seg(t, 0.1, 1.5));

    const projected = CLUSTER.map((raw) => {
      const r = rotY(raw, angle);
      return project3D(r.x, r.y, r.z, CX, CY, scale, 0.72);
    });

    let bondSvg = "";
    BONDS.forEach(([i, j], idx) => {
      const a = projected[i];
      const b = projected[j];
      const grow = easeOut(seg(t, 0.25 + idx * 0.045, 1.1 + idx * 0.045));
      const ex = a.x + (b.x - a.x) * grow;
      const ey = a.y + (b.y - a.y) * grow;
      const depth = (a.depth + b.depth) / 2;
      const o = (0.22 + depth * 0.55) * appear;
      const hi = pulse(t + idx * 0.13) * 0.25;
      bondSvg += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(ex)}" y2="${n(ey)}" stroke="${pal.accent}" stroke-width="${n(1.6 + depth * 3.2)}" opacity="${n(clamp(o + hi))}" stroke-linecap="round"/>`;
    });

    let atomSvg = "";
    projected.forEach((p, idx) => {
      const appearAtom = easeOut(seg(t, 0.05 + idx * 0.03, 0.8 + idx * 0.03));
      if (appearAtom <= 0) return;
      const r = (7 + 9 * p.depth) * appearAtom;
      const c = p.depth > 0.8 ? pal.ink : pal.accent2;
      atomSvg += glow(p.x, p.y, r * 3.4, pal.accent, 0.16 * appearAtom);
      atomSvg += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(r)}" fill="${c}" opacity="${n(0.85 * appearAtom)}"/>`;
      atomSvg += `<circle cx="${n(p.x - r * 0.3)}" cy="${n(p.y - r * 0.35)}" r="${n(r * 0.35)}" fill="#ffffff" opacity="${n(0.5 * appearAtom)}"/>`;
    });

    const ringR = 260 + 18 * Math.sin(t * 0.8);
    const markers = [0, 1, 2, 3].map((i) => {
      const a = t * 0.5 + (i * Math.PI) / 2;
      const x = CX + Math.cos(a) * ringR;
      const y = CY + Math.sin(a) * ringR * 0.42;
      return dot(x, y, 3.5, pal.accent2, 0.5);
    });

    return `
      ${circle(CX, CY, 300, { stroke: pal.accent, strokeWidth: 1, opacity: 0.09, dash: "3 12" })}
      ${circle(CX, CY, 210, { stroke: pal.accent, strokeWidth: 1, opacity: 0.06, dash: "2 14" })}
      ${markers.join("")}
      ${bondSvg}
      ${atomSvg}
      ${chip(CX, 1320, latticeLabel, { fill: "rgba(6,14,20,0.72)", color: pal.ink, size: 32, stroke: "rgba(143,227,255,0.25)" })}
      ${chip(CX - 340, CY + 210, atomLabel, { fill: "rgba(255,209,102,0.14)", color: pal.accent2, size: 27, stroke: "rgba(255,209,102,0.35)" })}
      ${chip(CX + 330, CY - 210, bondLabel, { fill: "rgba(90,210,255,0.12)", color: pal.accent, size: 25, stroke: "rgba(90,210,255,0.3)" })}
      ${label(CX, 500, "3B KRİSTAL AĞ", { size: 27, fill: pal.muted, letterSpacing: 6, opacity: 0.9 })}
    `;
  },
};

export const bondNetwork: VisualComponent = {
  id: "bond_network",
  labelTr: "Kovalent bağ ağı (tetrahedral)",
  domains: ["chemistry", "materials"],
  mechanisms: ["bond_network"],
  concepts: ["carbon_atom", "covalent_bond", "tetrahedral_lattice", "electron"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "tectonic_plate"],
  scientificNote:
    "Kovalent bağ, atomların elektron çiftlerini paylaşmasıdır. Elmasın her karbonu dört ayrı karbonla bağ kurar; bağ açısı yaklaşık 109,5°'dir.",
  params: [
    { name: "atomLabel", type: "string", default: "C", desc: "Merkez atom etiketi" },
    { name: "bondLabel", type: "string", default: "kovalent bağ", desc: "Bağ etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const atomLabel = str(params, "atomLabel", "C");
    const bondLabel = str(params, "bondLabel", "kovalent bağ");
    const grow = easeInOut(seg(t, 0.15, 1.4));
    const angle = t * 0.18 + 0.3;
    const r = 300;
    const center = { x: CX, y: CY };
    const neighbors = TETRA.map((d, i) => {
      const len = Math.hypot(d.x, d.y, d.z);
      const p = project3D((d.x / len) * 1.5, (d.y / len) * 1.5, (d.z / len) * 1.5, CX, CY, 165, 0.7);
      return { ...p, i };
    });

    let svg = "";
    neighbors.forEach((p, i) => {
      const x = center.x + (p.x - center.x) * grow;
      const y = center.y + (p.y - center.y) * grow;
      svg += `<line x1="${n(center.x)}" y1="${n(center.y)}" x2="${n(x)}" y2="${n(y)}" stroke="${pal.accent2}" stroke-width="7" opacity="${n(0.55 * grow)}" stroke-linecap="round"/>`;
      // paylaşılan elektron çifti
      const mx = (center.x + x) / 2;
      const my = (center.y + y) / 2;
      const nx = -(y - center.y);
      const ny = x - center.x;
      const nl = Math.hypot(nx, ny) || 1;
      const wob = Math.sin(t * 3 + i) * 6;
      for (const s of [-1, 1]) {
        svg += dot(mx + (nx / nl) * 12 * s + wob, my + (ny / nl) * 12 * s + wob, 5.5, pal.ink, 0.9);
      }
      svg += glow(p.x, p.y, 54, pal.accent3, 0.2 * grow);
      svg += dot(p.x, p.y, 26, pal.ink, 0.92);
      svg += label(p.x, p.y + 9, atomLabel, { size: 26, fill: pal.bg0, weight: 700, shadow: false });
    });

    svg += glow(center.x, center.y, 120, pal.accent2, 0.28);
    svg += dot(center.x, center.y, 40, pal.accent2, 1);
    svg += label(center.x, center.y + 13, atomLabel, { size: 38, fill: pal.bg0, weight: 800, shadow: false });
    svg += circle(center.x, center.y, 62, { stroke: pal.accent2, strokeWidth: 2, opacity: 0.4, dash: "6 8" });

    const arcR = 120;
    svg += `<path d="M ${n(center.x + arcR * Math.cos(-0.2))} ${n(center.y - 90)} A ${arcR} ${arcR} 0 0 1 ${n(center.x + arcR * Math.cos(1.4))} ${n(center.y - 20)}" fill="none" stroke="${pal.muted}" stroke-width="2" opacity="0.5"/>`;
    svg += label(center.x + 150, center.y - 60, "109,5°", { size: 28, fill: pal.muted });
    svg += chip(CX, CY + 350, bondLabel, { fill: "rgba(255,209,102,0.12)", color: pal.accent2, size: 30, stroke: "rgba(255,209,102,0.3)" });
    svg += label(CX, CY - 330, "DÖRT BAĞ, BİR ATOM", { size: 27, fill: pal.muted, letterSpacing: 5 });
    return svg;
  },
};

export const hardnessMeasure: VisualComponent = {
  id: "hardness_measure",
  labelTr: "Sertlik ölçümü (Mohs)",
  domains: ["materials", "physics"],
  mechanisms: ["hardness_measure"],
  concepts: ["hardness", "carbon_atom", "covalent_bond", "tetrahedral_lattice"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole"],
  scientificNote:
    "Mohs ölçeği çizilme direncini sıralar. Elmas 10. derecededir; bu ölçek doğrusal bir oran değil, sıralama ölçeğidir.",
  params: [{ name: "probeLabel", type: "string", default: "çizme ucu", desc: "Test ucu etiketi" }],
  render: ({ t, params, pal }) => {
    const probeLabel = str(params, "probeLabel", "çizme ucu");
    const rise = easeOut(seg(t, 0.2, 1.3));
    const x0 = 140;
    const x1 = 940;
    const y = 980;
    const segW = (x1 - x0) / 10;
    let bars = "";
    for (let i = 0; i < 10; i++) {
      const h = 40 + i * 16;
      const active = i === 9;
      bars += `<rect x="${n(x0 + i * segW + 6)}" y="${n(y - h * rise)}" width="${n(segW - 12)}" height="${n(h * rise)}" rx="10" fill="${active ? pal.accent2 : "rgba(255,255,255,0.13)"}" opacity="${active ? 0.95 : 0.55}"/>`;
      bars += label(x0 + i * segW + segW / 2, y + 46, String(i + 1), { size: 26, fill: active ? pal.accent2 : pal.muted, opacity: active ? 1 : 0.7 });
    }
    const probeY = 760 + Math.sin(t * 1.6) * 6;
    const scratchP = seg(t, 1.0, 2.6);
    let scratches = "";
    for (let i = 0; i < 4; i++) {
      const len = 220 * clamp(scratchP * 1.4 - i * 0.18);
      if (len <= 2) continue;
      scratches += `<line x1="${n(CX - 110)}" y1="${n(770 + i * 26)}" x2="${n(CX - 110 + len)}" y2="${n(770 + i * 26)}" stroke="${pal.ink}" stroke-width="2.4" opacity="0.35"/>`;
    }
    return `
      ${panel(90, 470, 900, 640, { fill: "rgba(8,16,26,0.55)", stroke: "rgba(143,227,255,0.16)" })}
      ${label(CX, 540, "MOH SERTLİK ÖLÇEĞİ", { size: 30, fill: pal.muted, letterSpacing: 5 })}
      ${label(CX, 690, "10", { size: 150, fill: pal.accent2, weight: 800 })}
      ${label(CX, 760, "elmas", { size: 30, fill: pal.ink, opacity: 0.85 })}
      ${scratches}
      ${bars}
      ${arrow(CX + 230, probeY - 120, CX + 40, 790, { color: pal.accent, width: 4 })}
      ${chip(CX + 300, probeY - 150, probeLabel, { color: pal.accent, size: 26, fill: "rgba(8,18,28,0.8)" })}
      ${label(CX, 1080, "ÇİZİLMEYE KARŞI DİRENÇ", { size: 28, fill: pal.muted, letterSpacing: 4 })}
    `;
  },
};

export const brittlenessCompare: VisualComponent = {
  id: "brittleness_compare",
  labelTr: "Sertlik–tokluk karşılaştırması",
  domains: ["materials", "physics"],
  mechanisms: ["brittleness_compare", "hardness_compare_summary"],
  concepts: ["hardness", "brittleness", "toughness", "mechanical_stress", "crack_propagation"],
  incompatibleConcepts: ["cell", "mitochondrion", "black_hole", "neuron"],
  scientificNote:
    "Sertlik çizilmeye, tokluk kırılmaya karşı dirençtir. Elmas serttir ancak gevrektir; darbe altında az deformasyonla kırılır.",
  params: [
    { name: "leftLabel", type: "string", default: "sertlik: yüksek", desc: "Sol panel etiketi" },
    { name: "rightLabel", type: "string", default: "tokluk: düşük", desc: "Sağ panel etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const leftLabel = str(params, "leftLabel", "sertlik: yüksek");
    const rightLabel = str(params, "rightLabel", "tokluk: düşük");
    const leftH = 420 * easeOut(seg(t, 0.2, 1.2));
    const rightH = 130 * easeOut(seg(t, 0.4, 1.4));
    const crack = seg(t, 1.6, 3.2);
    const crackPath = [];
    for (let i = 0; i <= 8; i++) {
      const p = (i / 8) * crack;
      crackPath.push(`${n(770 + p * 150 + Math.sin(i * 2.1) * 12)},${n(900 - p * 220 + Math.cos(i * 1.7) * 10)}`);
    }
    return `
      ${panel(70, 540, 440, 560, { fill: "rgba(8,16,26,0.5)", stroke: "rgba(255,255,255,0.08)" })}
      ${panel(570, 540, 440, 560, { fill: "rgba(8,16,26,0.5)", stroke: "rgba(255,255,255,0.08)" })}
      ${label(290, 600, "SERTLİK", { size: 32, fill: pal.accent2, letterSpacing: 4 })}
      ${label(790, 600, "TOKLUK", { size: 32, fill: pal.accent3, letterSpacing: 4 })}
      <rect x="150" y="${n(1050 - leftH)}" width="90" height="${n(leftH)}" rx="16" fill="${pal.accent2}" opacity="0.85"/>
      <rect x="650" y="${n(1050 - rightH)}" width="90" height="${n(rightH)}" rx="16" fill="${pal.accent3}" opacity="0.85"/>
      ${label(195, 1000, leftLabel, { size: 24, fill: pal.ink, opacity: 0.85 })}
      ${label(695, 1000, rightLabel, { size: 24, fill: pal.ink, opacity: 0.85 })}
      ${crack > 0 ? `<polyline points="${crackPath.join(" ")}" fill="none" stroke="${pal.ink}" stroke-width="5" opacity="0.9"/>` : ""}
      ${crack > 0.5 ? chip(790, 760, "çatlak", { color: pal.ink, size: 26, fill: "rgba(255,120,120,0.22)", stroke: "rgba(255,120,120,0.5)" }) : ""}
      ${label(CX, 1160, "İKİ FARKLI MEKANİK ÖZELLİK", { size: 27, fill: pal.muted, letterSpacing: 3 })}
      ${label(CX, 470, "ELMAS: SERT AMA GEVREK", { size: 34, fill: pal.ink, opacity: 0.9, letterSpacing: 2 })}
    `;
  },
};

export const cleavageFracture: VisualComponent = {
  id: "cleavage_fracture",
  labelTr: "Dilimlenme düzlemi ve çatlak ilerlemesi",
  domains: ["materials", "physics"],
  mechanisms: ["cleavage_fracture"],
  concepts: ["cleavage_plane", "crack_propagation", "mechanical_stress", "tetrahedral_lattice", "brittleness"],
  incompatibleConcepts: ["cell", "mitochondrion", "tectonic_plate", "black_hole"],
  scientificNote:
    "Elmasta {111} dilimlenme düzlemleri en zayıf bağ yoğunluğuna sahiptir. Darbe sonrası çatlak bu düzlemleri izler; çatlak hızı kristalde kilometre/saniye mertebesine çıkabilir.",
  params: [
    { name: "planeLabel", type: "string", default: "dilimlenme düzlemi", desc: "Düzlem etiketi" },
    { name: "crackLabel", type: "string", default: "çatlak", desc: "Çatlak etiketi" },
    { name: "stressLabel", type: "string", default: "darbe", desc: "Darbe etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const planeLabel = str(params, "planeLabel", "dilimlenme düzlemi");
    const crackLabel = str(params, "crackLabel", "çatlak");
    const stressLabel = str(params, "stressLabel", "darbe");

    // 2B kesit: hafif eğimli kare örgü
    const rows = 11;
    const cols = 9;
    const spacing = 74;
    const ox = CX - ((cols - 1) * spacing) / 2;
    const oy = 640;
    const split = easeInOut(seg(t, 1.4, 3.4));
    const crackX = easeInOut(seg(t, 1.2, 3.2));
    let lattice = "";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = ox + c * spacing + (r % 2) * spacing * 0.5;
        const y = oy + r * spacing * 0.84;
        const d = Math.abs(y - (830 + x * 0.18));
        const nearPlane = d < 46;
        const shift = nearPlane ? split * (y > 830 ? 14 : -14) : 0;
        const sev = nearPlane ? split * 26 : 0;
        const jitter = Math.sin(t * 2 + r + c) * sev * 0.3;
        lattice += dot(x + shift + jitter, y + shift * 0.4, nearPlane ? 9 : 7.5, nearPlane ? pal.accent2 : pal.ink, nearPlane ? 0.95 : 0.6);
      }
    }
    // bağ çizgileri (komşular)
    let bonds = "";
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const x1 = ox + c * spacing + (r % 2) * spacing * 0.5;
        const y1 = oy + r * spacing * 0.84;
        const x2 = x1 + spacing;
        const y3 = y1 + spacing * 0.84;
        const op = 0.16;
        bonds += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y1)}" stroke="${pal.accent}" stroke-width="1.1" opacity="${op}"/>`;
        bonds += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x1 + spacing * 0.5)}" y2="${n(y3)}" stroke="${pal.accent}" stroke-width="1.1" opacity="${op}"/>`;
      }
    }
    const planeY1 = 560;
    const planeY2 = 1240;
    const px1 = 250;
    const px2 = 830;
    const planeLine = `<line x1="${px1}" y1="${planeY1}" x2="${px2}" y2="${planeY2}" stroke="${pal.accent3}" stroke-width="2.5" stroke-dasharray="14 12" opacity="0.75"/>`;

    // çatlak: düzlem boyunca ilerleyen kırık
    const cx0 = 300;
    const cy0 = 640;
    const cx1 = 300 + 500 * crackX;
    const cy1 = 640 + 520 * crackX;
    const crackPts: string[] = [];
    const steps = 10;
    for (let i = 0; i <= steps * crackX; i++) {
      const p = i / steps;
      crackPts.push(`${n(cx0 + (cx1 - cx0) * p + Math.sin(p * 14) * 9)},${n(cy0 + (cy1 - cy0) * p + Math.cos(p * 11) * 7)}`);
    }
    const crackSvg = crackPts.length > 1 ? `<polyline points="${crackPts.join(" ")}" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.95"/><polyline points="${crackPts.join(" ")}" fill="none" stroke="${pal.accent2}" stroke-width="10" opacity="0.18" filter="url(#soft2)"/>` : "";

    const impact = 1 - seg(t, 0.4, 1.0);
    return `
      ${circle(470, 600, 300, { stroke: pal.accent, strokeWidth: 1, opacity: 0.06 })}
      ${bonds}
      ${lattice}
      ${planeLine}
      ${planeLabel ? chip(830, 1210, planeLabel, { color: pal.accent3, size: 25, fill: "rgba(20,14,40,0.8)", stroke: "rgba(157,140,255,0.4)" }) : ""}
      ${crackSvg}
      ${crackX > 0.2 ? chip(760, 980, crackLabel, { color: "#ffffff", size: 25, fill: "rgba(255,120,120,0.18)", stroke: "rgba(255,140,140,0.5)" }) : ""}
      ${arrow(400, 470, 450, 590, { color: pal.accent2, width: 5, opacity: 0.6 + 0.4 * impact })}
      ${chip(360, 450, stressLabel, { color: pal.accent2, size: 26, fill: "rgba(30,20,8,0.85)", stroke: "rgba(255,209,102,0.4)" })}
      ${label(CX, 1370, "BAĞLARIN EN ZAYIF OLDUĞU DÜZLEM", { size: 25, fill: pal.muted, letterSpacing: 2 })}
    `;
  },
};
