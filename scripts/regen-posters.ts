/**
 * Örnek posterlerini temsilî bir kareden yeniden üretir.
 *   node --import tsx scripts/regen-posters.ts
 */
import fs from "node:fs";
import path from "node:path";
import { buildTimeline } from "../packages/core/src/render/timeline.ts";
import { renderFrameSvg } from "../packages/core/src/render/svg.ts";
import { svgToPng } from "../packages/core/src/render/raster.ts";
import type { Project } from "../packages/core/src/project/types.ts";

const root = process.cwd();
const manifestPath = path.join(root, "samples", "manifest.json");
if (!fs.existsSync(manifestPath)) process.exit(0);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { slug: string; topic: string }[];
const work = path.join(root, "data", "samples-work", "projects");
if (!fs.existsSync(work)) process.exit(0);

const projects = fs
  .readdirSync(work)
  .map((d) => path.join(work, d, "project.json"))
  .filter((f) => fs.existsSync(f))
  .map((f) => JSON.parse(fs.readFileSync(f, "utf8")) as Project)
  .filter((p) => p.outputs?.videoPath && fs.existsSync(p.outputs.videoPath));

for (const entry of manifest) {
  const target = path.join(root, "samples", entry.slug, "poster.png");
  if (fs.existsSync(target)) continue;
  const project = projects
    .filter((p) => p.topic === entry.topic)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (!project) {
    console.log(`  atlandı: ${entry.slug}`);
    continue;
  }
  const timeline = buildTimeline(project.scenes, {
    targetDurationSec: project.targetDurationSec,
    fps: project.fps,
    speechDurations: project.narration.measured,
    audioPaths: project.narration.audioFiles,
    maxHoldPerScene: 1.6,
  });
  const first = timeline.scenes[0];
  const at = first.startSec + first.durationSec * 0.7;
  const svg = renderFrameSvg(timeline, at, { showSubtitles: false });
  const dir = path.join(root, "samples", entry.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "poster.png"), svgToPng(svg, { width: 720 }));
  console.log(`  poster: ${entry.slug} (${at.toFixed(2)} sn)`);
}
