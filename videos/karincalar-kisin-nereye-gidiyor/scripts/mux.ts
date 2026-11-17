import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const FFMPEG = process.env.FFMPEG ?? path.resolve(process.cwd(), "node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg");
const video = path.resolve(process.cwd(), "out/video-silent.mp4");
const audio = path.resolve(process.cwd(), "audio/master.wav");
const out = process.env.FINAL_OUT ?? path.resolve(process.cwd(), "../../output/karincalar-kisin-nereye-gidiyor.mp4");

if (!fs.existsSync(video)) throw new Error(`video yok: ${video}`);
if (!fs.existsSync(audio)) throw new Error(`ses yok: ${audio}`);
fs.mkdirSync(path.dirname(out), { recursive: true });

const args = [
  "-y",
  "-hide_banner",
  "-loglevel",
  "error",
  "-i",
  video,
  "-i",
  audio,
  "-map",
  "0:v:0",
  "-map",
  "1:a:0",
  "-c:v",
  "copy",
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-ar",
  "48000",
  "-ac",
  "2",
  "-movflags",
  "+faststart",
  "-t",
  "60",
  out,
];
console.log("[mux] ffmpeg çalıştırılıyor ->", out);
const r = spawnSync(FFMPEG, args, { stdio: "inherit" });
if (r.status !== 0) {
  console.error("[mux] ffmpeg başarısız:", r.status);
  process.exit(1);
}
console.log(`[mux] tamam -> ${out} (${(fs.statSync(out).size / 1024 / 1024).toFixed(2)} MB)`);
