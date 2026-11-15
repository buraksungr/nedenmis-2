/**
 * Yayın örneklerini bağımsız olarak yeniden doğrular (FFprobe) ve özet yazar.
 *   node --import tsx scripts/verify-samples.ts
 */
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { findFfprobe } from "../packages/core/src/render/tools.ts";

const exec = promisify(execFile);
const root = process.cwd();
const manifestPath = path.join(root, "samples", "manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.warn("samples/manifest.json yok — örnekler henüz üretilmemiş; doğrulama atlandı.");
  process.exit(0);
}

type ManifestEntry = { slug: string; videoPath: string; durationSec: number; frames: number; sha256: string; verificationOk: boolean; targetDurationSec: number };
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as ManifestEntry[];
const ffprobe = findFfprobe();

const summary = [];
let failures = 0;
for (const entry of manifest) {
  const file = path.join(root, entry.videoPath);
  if (!fs.existsSync(file)) {
    summary.push({ slug: entry.slug, ok: false, error: "dosya yok" });
    failures++;
    continue;
  }
  const { stdout } = await exec(ffprobe, ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", "-count_frames", file], { maxBuffer: 64 * 1024 * 1024 });
  const info = JSON.parse(stdout) as {
    format: { duration: string; size: string };
    streams: { codec_type: string; codec_name: string; width?: number; height?: number; sample_rate?: string; nb_read_frames?: string; avg_frame_rate?: string }[];
  };
  const v = info.streams.find((s) => s.codec_type === "video");
  const a = info.streams.find((s) => s.codec_type === "audio");
  const duration = Number(info.format.duration);
  const frames = Number(v?.nb_read_frames ?? 0);
  const checks = {
    duration_tolerance: Math.abs(duration - entry.targetDurationSec) / entry.targetDurationSec <= 0.051,
    resolution_1080x1920: v?.width === 1080 && v?.height === 1920,
    codec_h264: v?.codec_name === "h264",
    audio_aac_48k: a?.codec_name === "aac" && a?.sample_rate === "48000",
    frames_exact: Math.abs(frames - entry.frames) <= 1,
  };
  const ok = Object.values(checks).every(Boolean);
  if (!ok) failures++;
  summary.push({
    slug: entry.slug,
    file: entry.videoPath,
    durationSec: Math.round(duration * 1000) / 1000,
    targetDurationSec: entry.targetDurationSec,
    deviationPct: Math.round(((duration - entry.targetDurationSec) / entry.targetDurationSec) * 10000) / 100,
    frames,
    expectedFrames: entry.frames,
    resolution: `${v?.width}x${v?.height}`,
    video: v?.codec_name,
    audio: `${a?.codec_name}@${a?.sample_rate}`,
    checks,
    ok,
  });
  console.log(`${ok ? "✓" : "✗"} ${entry.slug}: ${duration.toFixed(2)} sn, ${frames} kare, ${v?.width}x${v?.height}, ${v?.codec_name}/${a?.codec_name}`);
}

fs.writeFileSync(path.join(root, "samples", "verification-summary.json"), JSON.stringify({ at: new Date().toISOString(), ffprobe, failures, samples: summary }, null, 2), "utf8");
console.log(`\nÖzet: ${summary.length} örnek, ${failures} sorun → samples/verification-summary.json`);
process.exit(failures ? 1 : 0);
