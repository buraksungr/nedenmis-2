/**
 * Windows CI duman testi: gömülü Python (eSpeak NG) + FFmpeg + FFprobe ile
 * gerçek 15 saniyelik taslak video üretir ve ölçümleri rapora yazar.
 *
 *   node --import tsx scripts/smoke-windows.ts
 *
 * Çıktı: reports/smoke-windows.json — bu dosya CI'da yayınlanır.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createProject, narrateProject, renderProject } from "../packages/core/src/project/pipeline.ts";
import { findFfmpeg, findFfprobe, findFonts } from "../packages/core/src/render/tools.ts";
import { pythonCandidates, ttsStatus } from "../packages/core/src/audio/tts.ts";

const started = Date.now();
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "nedenmis-smoke-"));
const report: Record<string, unknown> = {
  at: new Date().toISOString(),
  platform: process.platform,
  arch: process.arch,
  node: process.version,
  ffmpeg: safe(() => findFfmpeg()),
  ffprobe: safe(() => findFfprobe()),
  fonts: safe(() => findFonts()),
  pythonCandidates: pythonCandidates(),
  tts: await ttsStatus({ engine: "espeak" }),
};

let failure: string | null = null;
try {
  const { project } = createProject({ topic: "Elmas neden kolay kırılmaz?", targetDurationSec: 15, quality: "draft" });
  const narrated = await narrateProject(project, dataDir);
  const result = await renderProject(narrated, dataDir, {
    dataDir,
    narration: narrated.narration,
    onProgress: (u) => process.stdout.write(`\r  ${u.stage} ${Math.round(u.progress * 100)}% ${u.message.slice(0, 70)}   `),
  });

  Object.assign(report, {
    projectId: project.id,
    cardId: project.research?.cardId,
    scenes: project.scenes.map((s) => ({ id: s.id, component: s.spec.componentId, status: s.validation.status })),
    narrationEngine: narrated.narration.engineUsed,
    measuredSpeechSec: Object.values(narrated.narration.measured),
    video: result.videoPath,
    durationSec: result.verification.durationSec,
    frames: result.verification.video.framesRead,
    resolution: `${result.verification.video.width}x${result.verification.video.height}`,
    codecs: `${result.verification.video.codec}/${result.verification.audio.codec}@${result.verification.audio.sampleRate}`,
    verificationOk: result.verification.ok,
    failedChecks: result.verification.checks.filter((c) => !c.ok).map((c) => c.id),
    sizeBytes: fs.statSync(result.videoPath).size,
  });
  if (!result.verification.ok) failure = `Doğrulama başarısız: ${result.verification.checks.filter((c) => !c.ok).map((c) => c.id).join(", ")}`;
} catch (e) {
  failure = (e as Error).message;
  report.error = { message: (e as Error).message, stack: (e as Error).stack };
}

report.failure = failure;
report.elapsedSec = Math.round((Date.now() - started) / 100) / 10;
fs.mkdirSync(path.join(process.cwd(), "reports"), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), "reports", "smoke-windows.json"), JSON.stringify(report, null, 2), "utf8");

console.log("\nDuman testi raporu: reports/smoke-windows.json");
if (failure) {
  console.error("BAŞARISIZ:", failure);
  process.exit(1);
}
console.log("BAŞARILI —", report.durationSec, "sn,", report.frames, "kare,", report.resolution);

function safe<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}
