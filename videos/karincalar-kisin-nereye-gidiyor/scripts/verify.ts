import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { TIMELINE, FPS, TOTAL_FRAMES, TOTAL_SEC } from "../src/timeline";

const FFMPEG = process.env.FFMPEG ?? path.resolve(process.cwd(), "node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg");
const FFPROBE = process.env.FFPROBE ?? path.resolve(process.cwd(), "node_modules/@remotion/compositor-linux-x64-gnu/ffprobe");
const file = process.env.FINAL_OUT ?? path.resolve(process.cwd(), "../../output/karincalar-kisin-nereye-gidiyor.mp4");

type Check = { id: string; ok: boolean; detail: string; severity: "error" | "warning" };

function run(cmd: string, args: string[]): { code: number; stdout: Buffer; stderr: string } {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status ?? -1, stdout: r.stdout ?? Buffer.alloc(0), stderr: (r.stderr ?? "").toString() };
}

function probe(file: string) {
  const r = run(FFPROBE, ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file]);
  if (r.code !== 0) throw new Error(`ffprobe hatası: ${r.stderr.slice(0, 400)}`);
  return JSON.parse(r.stdout.toString("utf8")) as {
    streams: { codec_type: string; codec_name: string; width?: number; height?: number; avg_frame_rate?: string; sample_rate?: string; channels?: number; duration?: string; start_time?: string }[];
    format: { duration: string; format_name: string; size: string };
  };
}

/** Sahne ortasından kare çıkarır ve luma istatistiklerini döndürür. */
async function frameStats(file: string, timeSec: number, outJpg: string): Promise<{ mean: number; std: number }> {
  const r = run(FFMPEG, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-ss", timeSec.toFixed(3), "-i", file,
    "-frames:v", "1", "-vf", "scale=108:192",
    "-f", "image2", "-vcodec", "mjpeg", outJpg,
  ]);
  if (r.code !== 0 || !fs.existsSync(outJpg)) return { mean: 0, std: 0 };
  const { data } = await sharp(outJpg).greyscale().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (const v of data) sum += v;
  const mean = sum / data.length;
  let acc = 0;
  for (const v of data) acc += (v - mean) ** 2;
  return { mean: Math.round(mean * 100) / 100, std: Math.round(Math.sqrt(acc / data.length) * 100) / 100 };
}

async function main() {
  const checks: Check[] = [];
  const push = (id: string, ok: boolean, detail: string, severity: "error" | "warning" = "error") =>
    checks.push({ id, ok, detail, severity });

  const exists = fs.existsSync(file);
  push("file_exists", exists, exists ? file : `dosya yok: ${file}`);
  if (!exists) {
    console.log(JSON.stringify({ ok: false, checks }, null, 2));
    process.exit(1);
  }
  const bytes = fs.statSync(file).size;
  push("file_size", bytes > 50_000, `${(bytes / 1024 / 1024).toFixed(2)} MB`);

  const p = probe(file);
  const v = p.streams.find((s) => s.codec_type === "video");
  const a = p.streams.find((s) => s.codec_type === "audio");
  const dur = Number.parseFloat(p.format.duration);

  push("container_mp4", p.format.format_name.includes("mp4"), p.format.format_name);
  push("video_codec_h264", v?.codec_name === "h264", v?.codec_name ?? "yok");
  push("resolution_1080x1920", v?.width === 1080 && v?.height === 1920, `${v?.width}x${v?.height}`);
  const fps = v?.avg_frame_rate ? (() => { const [n, d] = v.avg_frame_rate!.split("/").map(Number); return d ? n / d : 0; })() : 0;
  push("fps_30", Math.abs(fps - 30) < 0.01, `${fps.toFixed(2)} fps`);
  push("duration_target", Math.abs(dur - Number(TOTAL_SEC)) < 0.4, `${dur.toFixed(3)} sn (beklenen ${TOTAL_SEC})`);
  push("audio_codec_aac", a?.codec_name === "aac", a?.codec_name ?? "yok");
  push("audio_48k_stereo", Number(a?.sample_rate) === 48000 && a?.channels === 2, `${a?.sample_rate} Hz / ${a?.channels} kanal`);
  push("av_sync_start", Number(a?.start_time ?? 0) < 0.2, `audio start=${a?.start_time ?? "?"}`);

  const counted = run(FFPROBE, ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "default=nw=1:nk=1", file]);
  const framesRead = Number.parseInt(counted.stdout.toString().trim(), 10) || 0;
  push("frame_count", Math.abs(framesRead - TOTAL_FRAMES) <= 1, `${framesRead} kare (beklenen ${TOTAL_FRAMES})`);

  const samples: { scene: string; time: number; mean: number; std: number; ok: boolean }[] = [];
  const dir = path.resolve(process.cwd(), "reports/frames");
  fs.mkdirSync(dir, { recursive: true });
  for (const e of TIMELINE) {
    const time = (e.start + e.duration / 2) / FPS;
    const { mean, std } = await frameStats(file, time, path.join(dir, `${e.id}.jpg`));
    const ok = mean > 6 && std > 8;
    samples.push({ scene: e.id, time, mean, std, ok });
    push(`scene_${e.id}`, ok, `luma=${mean} std=${std}`, ok ? "error" : "warning");
  }

  const ok = checks.every((c) => c.ok);
  const report = {
    ok,
    file,
    bytes,
    durationSec: dur,
    video: { codec: v?.codec_name, width: v?.width, height: v?.height, fps, framesRead, framesExpected: TOTAL_FRAMES },
    audio: { codec: a?.codec_name, sampleRate: Number(a?.sample_rate), channels: a?.channels, durationSec: a?.duration },
    checks,
    sceneSamples: samples,
  };
  fs.mkdirSync(path.resolve(process.cwd(), "reports"), { recursive: true });
  fs.writeFileSync(path.resolve(process.cwd(), "reports/verification.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(ok ? 0 : 1);
}

main();
