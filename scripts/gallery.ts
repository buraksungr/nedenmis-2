/** Tüm görsel bileşenlerin denetim sayfalarını üretir (geliştirme aracı). */
import fs from "node:fs";
import path from "node:path";
import { CARDS_A } from "../packages/core/src/ontology/cards-a.ts";
import { CARDS_B } from "../packages/core/src/ontology/cards-b.ts";
import { buildScene } from "../packages/core/src/visual/planner.ts";
import { getComponent } from "../packages/core/src/visual/components/index.ts";
import { renderFrameSvg } from "../packages/core/src/render/svg.ts";
import { svgToPng } from "../packages/core/src/render/raster.ts";
import { paletteFor } from "../packages/core/src/visual/primitives.ts";
import { buildTimeline } from "../packages/core/src/render/timeline.ts";
import { Resvg } from "@resvg/resvg-js";

const outDir = path.resolve("data/gallery");
fs.mkdirSync(outDir, { recursive: true });
const cards = [...CARDS_A, ...CARDS_B];
const seen = new Map<string, { png: Buffer; card: string; step: string }>();

for (const card of cards) {
  for (const step of card.steps) {
    const scene = buildScene(card, step, 0);
    if (seen.has(scene.spec.componentId)) continue;
    const timeline = buildTimeline([{ ...scene, narration: step.narration }], { targetDurationSec: 8, fps: 30, speechDurations: { [scene.id]: 5 } });
    const svg = renderFrameSvg(timeline, 3, { showSubtitles: false });
    const png = svgToPng(svg, { width: 405 });
    seen.set(scene.spec.componentId, { png, card: card.id, step: step.id });
    fs.writeFileSync(path.join(outDir, `${scene.spec.componentId}.png`), png);
  }
}

// Bileşen sayfası: 3x2 ızgara
const ids = [...seen.keys()];
const cols = 3;
const cellW = 405;
const cellH = 720;
const rowsPerSheet = 2;
const perSheet = cols * rowsPerSheet;
for (let s = 0; s * perSheet < ids.length; s++) {
  const slice = ids.slice(s * perSheet, (s + 1) * perSheet);
  const W = cols * cellW;
  const H = rowsPerSheet * cellH;
  let images = "";
  slice.forEach((id, i) => {
    const c = seen.get(id)!;
    const x = (i % cols) * cellW;
    const y = Math.floor(i / cols) * cellH;
    images += `<image x="${x}" y="${y}" width="${cellW}" height="${cellH}" href="data:image/png;base64,${c.png.toString("base64")}"/>`;
    images += `<rect x="${x + 6}" y="${y + 6}" width="200" height="28" rx="6" fill="rgba(0,0,0,0.7)"/>`;
    images += `<text x="${x + 12}" y="${y + 26}" font-size="16" font-family="DejaVu Sans" fill="#ffd166">${id}</text>`;
  });
  const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#000"/>${images}</svg>`;
  const png = new Resvg(sheet, { fitTo: { mode: "original" } }).render().asPng();
  fs.writeFileSync(path.join(outDir, `sheet-${s + 1}.png`), Buffer.from(png));
}
console.log(`Bileşenler: ${ids.length}; sayfalar: ${Math.ceil(ids.length / perSheet)}; dizin: ${outDir}`);
void paletteFor;
void getComponent;
