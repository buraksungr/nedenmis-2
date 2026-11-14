/**
 * Tek konu için uçtan uca video üretir.
 *   node --import tsx scripts/render-one.ts "Elmas neden kolay kırılmaz?" 60 espeak high
 */
import path from "node:path";
import { runPipeline } from "../packages/core/src/project/pipeline.ts";
import { resolveDataDir } from "../packages/core/src/render/tools.ts";

const topic = process.argv[2] ?? "Elmas neden kolay kırılmaz?";
const duration = Number(process.argv[3] ?? 60);
const engine = (process.argv[4] as "espeak" | "chatterbox" | "piper" | "silent") ?? "espeak";
const quality = (process.argv[5] as "draft" | "standard" | "high") ?? "high";
const dataDir = resolveDataDir();

const started = Date.now();
const result = await runPipeline(
  { topic, targetDurationSec: duration, quality },
  {
    dataDir,
    narration: { engine, voice: "tr", rate: 165 },
    onProgress: (u) => {
      if (u.detail) process.stdout.write(`\r[${u.stage}] ${Math.round(u.progress * 100)}% ${u.message} — ${u.detail}`.slice(0, 160));
      else process.stdout.write(`\r[${u.stage}] ${Math.round(u.progress * 100)}% ${u.message}`.slice(0, 160));
      if (u.stage === "done") process.stdout.write("\n");
    },
    log: (m) => console.log(`\n${m}`),
  },
);

console.log("Video:", result.videoPath);
console.log("Süre:", result.verification.durationSec, "sn / hedef", duration);
console.log("Kare:", result.verification.video.framesRead, "/", result.timeline.frames);
console.log("Doğrulama:", result.verification.ok ? "GEÇTİ" : "SORUN VAR");
result.verification.checks.filter((c) => !c.ok).forEach((c) => console.log("  !", c.id, c.detail));
console.log("Toplam süre:", ((Date.now() - started) / 1000).toFixed(0), "sn");
console.log("Proje:", path.dirname(result.videoPath));
