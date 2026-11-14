/**
 * Geliştirme yardımcısı: bir konu için sahne planı üretir ve her sahnenin
 * ortasından PNG kare yazar. Görsel denetim için kullanılır.
 *
 *   node --import tsx scripts/preview-frames.ts "Elmas neden kolay kırılmaz?" 60
 */
import fs from "node:fs";
import path from "node:path";
import { createProject, timelineFor } from "../packages/core/src/project/pipeline.ts";
import { renderFrameSvg } from "../packages/core/src/render/svg.ts";
import { svgToPng } from "../packages/core/src/render/raster.ts";

const topic = process.argv[2] ?? "Elmas neden kolay kırılmaz?";
const duration = Number(process.argv[3] ?? 60);
const outDir = path.resolve("data/preview");
fs.mkdirSync(outDir, { recursive: true });

const { project } = createProject({ topic, targetDurationSec: duration }, (u) => {
  process.stdout.write(`[${u.stage}] ${Math.round(u.progress * 100)}% ${u.message}\n`);
});

const timeline = timelineFor(project, { useAudio: false });
console.log("\nSahne planı:");
for (const s of project.scenes) {
  console.log(` ${s.id} | ${s.spec.componentId} | ${s.spec.mechanism} | ${s.validation.status} | ${s.durationSec?.toFixed(1) ?? "-"}s | ${s.overlay}`);
  console.log(`   ${s.narration}`);
}
fs.writeFileSync(path.join(outDir, "project.json"), JSON.stringify(project, null, 2), "utf8");

for (let i = 0; i < timeline.scenes.length; i++) {
  const s = timeline.scenes[i];
  const t = s.startSec + Math.min(4, s.durationSec * 0.6);
  const svg = renderFrameSvg(timeline, t, { showSubtitles: false });
  fs.writeFileSync(path.join(outDir, `scene-${String(i + 1).padStart(2, "0")}.png`), svgToPng(svg, { width: 720 }));
  fs.writeFileSync(path.join(outDir, `scene-${String(i + 1).padStart(2, "0")}.svg`), svg);
}
console.log(`\nKareler: ${outDir}`);
