/**
 * Eski örneklerin eksik sahne sürelerini yeniden hesaplar ve script.txt dosyalarını tazeler.
 * Aynı deterministik zaman çizelgesi algoritmasını (buildTimeline) kullanır.
 *   node --import tsx scripts/backfill-timings.ts
 */
import fs from "node:fs";
import path from "node:path";
import { buildTimeline } from "../packages/core/src/render/timeline.ts";
import type { Project } from "../packages/core/src/project/types.ts";

const root = process.cwd();
const manifestPath = path.join(root, "samples", "manifest.json");
if (!fs.existsSync(manifestPath)) process.exit(0);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { slug: string; scenes: { id: string; durationSec?: number }[] }[];
const work = path.join(root, "data", "samples-work", "projects");
if (!fs.existsSync(work)) {
  console.log("samples-work yok, atlandı.");
  process.exit(0);
}

for (const entry of manifest) {
  const dir = path.join(root, "samples", entry.slug);
  const scriptPath = path.join(dir, "script.txt");
  if (fs.existsSync(scriptPath) && !fs.readFileSync(scriptPath, "utf8").includes("undefined")) continue;

  const candidates = fs
    .readdirSync(work)
    .map((d) => path.join(work, d, "project.json"))
    .filter((f) => fs.existsSync(f))
    .map((f) => ({ file: f, project: JSON.parse(fs.readFileSync(f, "utf8")) as Project }))
    .filter((c) => c.project.topic === entry.topic && c.project.outputs?.videoPath && fs.existsSync(c.project.outputs.videoPath))
    .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt));
  const projectFile = candidates[0]?.file;
  if (!projectFile) {
    console.log(`  atlandı (proje bulunamadı): ${entry.slug}`);
    continue;
  }
  const project = JSON.parse(fs.readFileSync(projectFile, "utf8")) as Project;
  const timeline = buildTimeline(project.scenes, {
    targetDurationSec: project.targetDurationSec,
    fps: project.fps,
    speechDurations: project.narration.measured,
    audioPaths: project.narration.audioFiles,
    maxHoldPerScene: 1.6,
  });
  const timed = new Map(timeline.scenes.map((t) => [t.id, t]));
  fs.writeFileSync(
    scriptPath,
    `${project.title}\n${project.topic}\n\n` +
      project.scenes
        .map((s, i) => {
          const t = timed.get(s.id);
          return `${i + 1}. [${t ? `${t.startSec.toFixed(2)}–${(t.startSec + t.durationSec).toFixed(2)} sn | konuşma ${t.speechDurationSec.toFixed(2)} sn` : ""}] ${s.narration}`;
        })
        .join("\n\n") +
      "\n",
    "utf8",
  );
  entry.scenes = entry.scenes.map((sc) => ({
    ...sc,
    durationSec: Math.round((timed.get(sc.id)?.durationSec ?? 0) * 100) / 100,
    speechDurationSec: Math.round((timed.get(sc.id)?.speechDurationSec ?? 0) * 100) / 100,
  }));
  console.log(`  tazelendi: ${entry.slug}`);
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
