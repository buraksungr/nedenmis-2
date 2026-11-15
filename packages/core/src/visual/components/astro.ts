import { arrow, chip, circle, clamp, dot, easeInOut, easeOut, glow, label, n, panel, pulse, rand, seg, wrapText } from "../primitives.js";
import type { VisualComponent } from "./types.js";
import { str } from "./types.js";

const CX = 540;
const CY = 860;

export const spacetimeGrid: VisualComponent = {
  id: "spacetime_grid",
  labelTr: "Uzay-zaman eğriliği",
  domains: ["astronomy", "physics"],
  mechanisms: ["spacetime_grid"],
  concepts: ["spacetime_curvature", "mass", "gravitational_force", "black_hole", "energy"],
  incompatibleConcepts: ["cell", "mitochondrion", "chloride_ion", "covalent_bond", "tetrahedral_lattice", "tectonic_plate"],
  scientificNote:
    "Genel görelilikte kütle uzay-zamanı büker; cisimler bu eğrilikte jeodezikleri izler. Temsilî çizim, eğriliğin ne olduğunu gösterir; ölçekli bir gömme diyagramıdır.",
  params: [
    { name: "gridLabel", type: "string", default: "uzay-zaman", desc: "Izgara etiketi" },
    { name: "massLabel", type: "string", default: "kütle", desc: "Kütle etiketi" },
    { name: "wellLabel", type: "string", default: "çukur", desc: "Çukur etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const gridLabel = str(params, "gridLabel", "uzay-zaman");
    const massLabel = str(params, "massLabel", "kütle");
    const wellLabel = str(params, "wellLabel", "çukur");
    const depth = 150 * easeOut(seg(t, 0.2, 1.8));
    const y0 = 700;
    const rows = 9;
    const cols = 13;
    const warp = (x: number, baseY: number) => {
      const dx = (x - CX) / 340;
      const dy = (baseY - y0) / 340;
      const r2 = dx * dx + dy * dy + 0.18;
      // Değerler kadraj dışına taşarsa resvg'de dejenere geometri oluşur; güvenli aralığa sıkıştır.
      return clamp(baseY - (depth / r2) * 0.55, 140, 1860);
    };
    let horizontal = "";
    let vertical = "";
    for (let r = 0; r < rows; r++) {
      const baseY = 520 + r * 96;
      let d = "";
      for (let c = 0; c <= cols * 2; c++) {
        const x = 60 + c * 40;
        d += `${c === 0 ? "M" : "L"} ${n(x)} ${n(warp(x, baseY))} `;
      }
      horizontal += `<path d="${d}" fill="none" stroke="${pal.accent}" stroke-width="${1 + (rows - r) * 0.12}" opacity="0.3"/>`;
    }
    for (let c = 0; c < cols; c++) {
      const baseX = 60 + c * 80;
      let d = "";
      for (let r = 0; r <= rows * 2; r++) {
        const y = 520 + r * 48;
        const dx = (baseX - CX) / 340;
        const dy = (y - y0) / 340;
        const r2 = dx * dx + dy * dy + 0.18;
        const yy = clamp(y - (depth / r2) * 0.55, 140, 1860);
        const xx = clamp(baseX + (baseX - CX) * (depth / r2) * 0.05, 40, 1040);
        d += `${r === 0 ? "M" : "L"} ${n(xx)} ${n(yy)} `;
      }
      vertical += `<path d="${d}" fill="none" stroke="${pal.accent}" stroke-width="1.2" opacity="0.2"/>`;
    }
    const orbitA = t * 0.9;
    const orbitX = CX + Math.cos(orbitA) * 300;
    const orbitY = warp(orbitX, y0 + Math.sin(orbitA) * 90) - 16;
    return `
      ${label(CX, 470, "KÜTLE UZAY-ZAMANI BÜKER", { size: 27, fill: pal.muted, letterSpacing: 4 })}
      ${horizontal}
      ${vertical}
      ${glow(CX, y0 - 10, 150, pal.accent3, 0.4)}
      <circle cx="${CX}" cy="${n(y0 - 10)}" r="${n(38 + depth * 0.06)}" fill="#0b0f20" stroke="${pal.accent3}" stroke-width="2.5"/>
      <circle cx="${CX}" cy="${n(y0 - 10)}" r="${n(22 + depth * 0.04)}" fill="url(#sheen)"/>
      ${orbitX ? `<circle cx="${n(orbitX)}" cy="${n(orbitY)}" r="8" fill="${pal.accent2}"/>` : ""}
      ${label(CX, 1170, massLabel, { size: 30, fill: pal.ink, opacity: 0.9 })}
      ${chip(820, 1040, wellLabel, { color: pal.accent, size: 24, fill: "rgba(8,14,26,0.8)" })}
      ${chip(250, 520, gridLabel, { color: pal.accent, size: 24, fill: "rgba(8,14,26,0.8)" })}
      ${label(CX, 1270, "Eğrilik arttıkça çekim güçlenir", { size: 25, fill: pal.muted })}
    `;
  },
};

export const eventHorizon: VisualComponent = {
  id: "event_horizon",
  labelTr: "Olay ufku ve kaçış yolları",
  domains: ["astronomy", "physics"],
  mechanisms: ["event_horizon"],
  concepts: ["event_horizon", "escape_velocity", "black_hole", "light", "photon", "singularity", "spacetime_curvature"],
  incompatibleConcepts: ["cell", "mitochondrion", "covalent_bond", "sodium_ion", "tectonic_plate"],
  scientificNote:
    "Olay ufku bir yüzey değil, kaçış hızının ışık hızını aştığı sınırdır. Işık ufkun dışında bükülerek kaçabilir; içinde tüm yollar merkeze gider.",
  params: [
    { name: "horizonLabel", type: "string", default: "olay ufku", desc: "Ufuk etiketi" },
    { name: "escapeLabel", type: "string", default: "kaçabilir", desc: "Kaçış etiketi" },
    { name: "trappedLabel", type: "string", default: "kaçamaz", desc: "Tuzak etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const horizonLabel = str(params, "horizonLabel", "olay ufku");
    const escapeLabel = str(params, "escapeLabel", "kaçabilir");
    const trappedLabel = str(params, "trappedLabel", "kaçamaz");
    const R = 190;
    let rays = "";
    // kaçan fotonlar: ufka yaklaşıp bükülerek uzaklaşır
    for (let i = 0; i < 6; i++) {
      const p = ((t * 0.3 + i / 6) % 1);
      const impact = R * (1.18 + i * 0.14);
      const yIn = CY - (i - 2.5) * 120 - impact * 0.15;
      const startX = 40;
      const endX = 1040;
      const midX = (startX + endX) / 2;
      const bendY = yIn + (yIn > CY ? -1 : 1) * 0;
      const path = `M ${startX} ${n(yIn)} Q ${n(midX)} ${n(CY + (yIn - CY) * 2.4)} ${endX} ${n(yIn - 18)}`;
      rays += `<path d="${path}" fill="none" stroke="${pal.accent2}" stroke-width="2.2" opacity="0.0"/>`;
      const dotP = clamp(p * 1.2);
      // basit bezier örnekleme
      const qx = (1 - dotP) * (1 - dotP) * startX + 2 * (1 - dotP) * dotP * midX + dotP * dotP * endX;
      const qy = (1 - dotP) * (1 - dotP) * yIn + 2 * (1 - dotP) * dotP * (CY + (yIn - CY) * 2.4) + dotP * dotP * (yIn - 18);
      rays += `<path d="${path}" fill="none" stroke="${pal.accent2}" stroke-width="2" opacity="0.22" stroke-dasharray="3 10"/>`;
      rays += dot(qx, qy, 6, "#ffe9a8", 0.9);
    }
    // içine düşen foton
    let plunging = "";
    for (let i = 0; i < 3; i++) {
      const p = ((t * 0.45 + i / 3) % 1);
      const a = -0.6 + i * 0.9 + p * 2.4;
      const rr = R * (1.5 - p * 1.5);
      plunging += dot(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr * 0.85, 5, "#ff9d7a", 0.8 * (1 - p));
    }
    return `
      ${label(CX, 470, "OLAY UFKU: GERİ DÖNÜŞÜ OLMAYAN SINIR", { size: 26, fill: pal.muted, letterSpacing: 3 })}
      ${glow(CX, CY, 300, "#2a1a4a", 0.55)}
      ${rays}
      ${plunging}
      ${circle(CX, CY, R + 70, { stroke: pal.accent3, strokeWidth: 2, opacity: 0.35, dash: "10 12" })}
      ${circle(CX, CY, R, { fill: "#05060c", stroke: "#6f6bb5", strokeWidth: 3 })}
      ${label(CX, CY + 12, "•", { size: 80, fill: "#ffffff", opacity: 0.18 })}
      ${chip(CX, CY + R + 100, horizonLabel, { color: pal.accent3, size: 27, fill: "rgba(14,12,30,0.85)", stroke: "rgba(157,140,255,0.4)" })}
      ${chip(210, 520, escapeLabel, { color: "#ffe0a8", size: 24, fill: "rgba(34,26,8,0.85)" })}
      ${arrow(180, 560, 300, 620, { color: "#ffe0a8", width: 2.5, opacity: 0.7 })}
      ${chip(860, 1180, trappedLabel, { color: "#ffb0a0", size: 24, fill: "rgba(34,12,10,0.85)" })}
      ${label(CX, 1280, "Ufkun içinde ışık bile kaçamaz", { size: 25, fill: pal.muted })}
    `;
  },
};

export const accretionDisk: VisualComponent = {
  id: "accretion_disk",
  labelTr: "Yığılma diski",
  domains: ["astronomy", "physics"],
  mechanisms: ["accretion_disk"],
  concepts: ["accretion_disk", "black_hole", "mass", "energy", "event_horizon"],
  incompatibleConcepts: ["cell", "mitochondrion", "chloride_ion", "covalent_bond", "neuron"],
  scientificNote:
    "Kara deliğe düşen madde açısal momentum nedeniyle disk oluşturur. İç bölge daha hızlı döner ve sürtünmeyle ısınır; disk X-ışını yayar. Disk görüntüde olduğu gibi ince bir düzlemde değil, kalınlığı olan bir yapıdır.",
  params: [
    { name: "diskLabel", type: "string", default: "yığılma diski", desc: "Disk etiketi" },
    { name: "holeLabel", type: "string", default: "kara delik", desc: "Kara delik etiketi" },
    { name: "heatLabel", type: "string", default: "sıcak madde", desc: "Sıcaklık etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const diskLabel = str(params, "diskLabel", "yığılma diski");
    const holeLabel = str(params, "holeLabel", "kara delik");
    const heatLabel = str(params, "heatLabel", "sıcak madde");
    const rings = [130, 190, 250, 320, 400, 480];
    let disk = "";
    rings.forEach((r, i) => {
      const ry = r * 0.26;
      const heat = 1 - i / rings.length;
      const color = i < 2 ? "#fff3d0" : i < 4 ? "#ffd166" : "#ff7a4d";
      disk += `<ellipse cx="${CX}" cy="${CY}" rx="${r}" ry="${ry}" fill="none" stroke="${color}" stroke-width="${n(10 + heat * 12)}" opacity="${n(0.12 + heat * 0.22)}"/>`;
      disk += `<ellipse cx="${CX}" cy="${CY}" rx="${r}" ry="${ry}" fill="none" stroke="${color}" stroke-width="2.2" opacity="${n(0.35 + heat * 0.3)}"/>`;
    });
    let particles = "";
    for (let i = 0; i < 40; i++) {
      const ring = rings[Math.floor(rand(43, i) * rings.length)];
      const speed = 1.6 / Math.sqrt(ring / 100);
      const a = t * speed + rand(47, i) * Math.PI * 2;
      const x = CX + Math.cos(a) * ring;
      const y = CY + Math.sin(a) * ring * 0.26;
      const front = Math.sin(a) > 0;
      const color = ring < 220 ? "#fff6dd" : ring < 380 ? "#ffd98a" : "#ff9b6a";
      particles += dot(x, y, 4.5 + (front ? 1.6 : 0), color, front ? 0.95 : 0.45);
    }
    const jet = "";
    return `
      ${label(CX, 470, "MADDE DİSKTE DÖNER, ISINIR", { size: 27, fill: pal.muted, letterSpacing: 3 })}
      ${jet}
      ${disk}
      ${particles}
      ${glow(CX, CY, 150, "#ffb35c", 0.3)}
      ${circle(CX, CY, 96, { fill: "#04050a", stroke: "#ffcf8a", strokeWidth: 2.5 })}
      <circle cx="${CX}" cy="${CY}" r="96" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.16"/>
      ${label(CX, CY + 300, holeLabel, { size: 28, fill: pal.ink, opacity: 0.9 })}
      ${chip(250, 640, diskLabel, { color: "#ffe0a8", size: 25, fill: "rgba(30,20,8,0.85)", stroke: "rgba(255,200,120,0.35)" })}
      ${chip(840, 1220, heatLabel, { color: "#ffb98a", size: 24, fill: "rgba(36,16,8,0.85)" })}
      ${label(CX, 1330, "İç bölge daha sıcak: X-ışını yayar", { size: 25, fill: pal.muted })}
    `;
  },
};

export const gravitationalLensing: VisualComponent = {
  id: "gravitational_lensing",
  labelTr: "Kütle çekimsel mercekleme",
  domains: ["astronomy", "physics"],
  mechanisms: ["gravitational_lensing"],
  concepts: ["gravitational_lensing", "light", "spacetime_curvature", "black_hole", "mass", "photon"],
  incompatibleConcepts: ["cell", "mitochondrion", "covalent_bond", "tectonic_plate", "sodium_ion"],
  scientificNote:
    "Kara deliğin arkasındaki ışık, kütle çekimiyle bükülür. Gözlemci aynı kaynağın birden fazla görüntüsünü veya bir Einstein halkası görür; bu, ışığın kütlesiz olmasına rağmen yolunun eğrilmesidir.",
  params: [
    { name: "starLabel", type: "string", default: "arka plan yıldızı", desc: "Yıldız etiketi" },
    { name: "ringLabel", type: "string", default: "ışık halkası", desc: "Halka etiketi" },
    { name: "holeLabel", type: "string", default: "kara delik", desc: "Kara delik etiketi" },
  ],
  render: ({ t, params, pal }) => {
    const starLabel = str(params, "starLabel", "arka plan yıldızı");
    const ringLabel = str(params, "ringLabel", "ışık halkası");
    const holeLabel = str(params, "holeLabel", "kara delik");
    const bend = easeInOut(seg(t, 0.4, 2.2));
    let stars = "";
    for (let i = 0; i < 34; i++) {
      const x = 70 + rand(53, i) * 940;
      const y = 420 + rand(59, i) * 700;
      const dist = Math.hypot(x - CX, y - CY);
      if (dist < 170) continue;
      const tw = 0.35 + 0.4 * ((Math.sin(t * 2 + i) + 1) / 2);
      stars += dot(x, y, 2 + rand(61, i) * 2.4, "#eaf0ff", tw * 0.8);
    }
    const starX = CX;
    const starY = 470;
    const paths = [-1, 1].map((sign) => {
      const midX = CX + sign * 130;
      const midY = 690;
      return `M ${starX} ${starY} Q ${n(midX)} ${midY} ${n(CX + sign * 430)} 1180`;
    });
    const ringR = 175 + bend * 22;
    return `
      ${label(CX, 470, "IŞIK YOLU KÜTLE ÇEKİMİYLE BÜKÜLÜR", { size: 26, fill: pal.muted, letterSpacing: 3 })}
      ${stars}
      ${glow(CX, CY, 220, "#2b2050", 0.6)}
      ${circle(CX, CY, 92, { fill: "#04050a", stroke: "#8f9dff", strokeWidth: 2.5 })}
      ${paths
        .map(
          (d, i) =>
            `<path d="${d}" fill="none" stroke="${pal.accent2}" stroke-width="2.6" opacity="${n(0.25 + bend * 0.5)}" stroke-dasharray="6 8"/>` +
            `<circle cx="${n(CX + (i ? 430 : -430))}" cy="1180" r="7" fill="${pal.accent2}" opacity="${n(bend)}"/>`,
        )
        .join("")}
      ${glow(starX, starY, 42, "#fff2c8", 0.5)}
      ${dot(starX, starY, 12, "#fff2c8", 0.95)}
      ${label(starX, starY - 40, starLabel, { size: 22, fill: pal.muted })}
      ${bend > 0.5 ? circle(CX, CY, ringR, { stroke: "#ffd166", strokeWidth: 3, opacity: 0.35 * bend, dash: "2 10" }) : ""}
      ${bend > 0.5 ? chip(CX, CY + 300, ringLabel, { color: "#ffe0a8", size: 24, fill: "rgba(30,22,8,0.85)" }) : ""}
      ${chip(CX, CY - 150, holeLabel, { color: "#c9c4ff", size: 24, fill: "rgba(12,10,28,0.85)" })}
      ${label(CX, 1310, "Aynı yıldız birden fazla yerde görünebilir", { size: 25, fill: pal.muted })}
    `;
  },
};
