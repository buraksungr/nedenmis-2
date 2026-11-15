import { arrow, chip, circle, dot, easeOut, glow, label, n, panel, pulse, rand, seg } from "../primitives.js";
import type { VisualComponent } from "./types.js";
import { str } from "./types.js";
import { CONCEPTS } from "../../ontology/concepts.js";

/**
 * Mekanizma bileşeni bulunamadığında kullanılan şematik kavram haritası.
 * Bilimsel olarak doğru bir diyagram, yanlış bir animasyondan iyidir.
 */
export const schematicDiagram: VisualComponent = {
  id: "schematic_diagram",
  labelTr: "Şematik kavram haritası",
  domains: ["physics", "chemistry", "biology", "astronomy", "geology", "materials", "mathematics", "engineering", "technology", "earth", "environment"],
  mechanisms: ["schematic_diagram"],
  concepts: Object.keys(CONCEPTS),
  incompatibleConcepts: [],
  scientificNote:
    "Bu sahne, doğrulanmış bilgi kartındaki kavramları ilişkileriyle gösteren şematik bir diyagramdır. Nedensel iddia üretmez; yalnızca kavramları ve bağlantılarını gösterir.",
  params: [
    { name: "nodes", type: "string[]", default: [], desc: "Gösterilecek kavram kimlikleri" },
    { name: "heading", type: "string", default: "KAVRAM HARİTASI", desc: "Başlık" },
  ],
  render: ({ t, params, pal }) => {
    const nodes = Array.isArray(params.nodes) ? (params.nodes as string[]).slice(0, 6) : [];
    const heading = str(params, "heading", "KAVRAM HARİTASI");
    const list = nodes.length ? nodes : ["concept"];
    const cx = 540;
    const cy = 860;
    const R = 300;
    const points = list.map((id, i) => {
      const a = (i / list.length) * Math.PI * 2 - Math.PI / 2;
      return { id, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * 0.78 };
    });
    let edges = "";
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      const p = easeOut(seg(t, 0.3 + i * 0.15, 1.1 + i * 0.15));
      const ex = a.x + (b.x - a.x) * p;
      const ey = a.y + (b.y - a.y) * p;
      edges += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(ex)}" y2="${n(ey)}" stroke="${pal.accent}" stroke-width="2" opacity="0.35"/>`;
    }
    let nodeSvg = "";
    points.forEach((p, i) => {
      const c = CONCEPTS[p.id];
      const text = c?.diagramLabel ?? p.id;
      const appear = easeOut(seg(t, 0.1 + i * 0.1, 0.7 + i * 0.1));
      nodeSvg += glow(p.x, p.y, 70, pal.accent2, 0.1 * appear);
      nodeSvg += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(52 * appear)}" fill="rgba(255,209,102,0.12)" stroke="${pal.accent2}" stroke-width="2" opacity="${appear}"/>`;
      nodeSvg += label(p.x, p.y + 8, text, { size: 20, fill: pal.ink, opacity: appear });
    });
    return `
      ${label(cx, 420, heading.toLocaleUpperCase("tr"), { size: 28, fill: pal.muted, letterSpacing: 5 })}
      ${circle(cx, cy, R * 0.9, { stroke: pal.accent, strokeWidth: 1, opacity: 0.08, dash: "3 12" })}
      ${edges}
      ${nodeSvg}
      ${label(cx, cy + 8, "kavramlar", { size: 22, fill: pal.muted, opacity: 0.45 })}
      ${chip(cx, 1250, "Şematik diyagram: nedensel animasyon değil", { color: pal.muted, size: 21, fill: "rgba(8,16,26,0.6)" })}
    `;
  },
};
