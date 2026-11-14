import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { findFfmpeg, findFfprobe, ensureDir } from "./tools.js";
import type { Timeline } from "./timeline.js";

export type VerifyCheck = { id: string; ok: boolean; detail: string; severity: "error" | "warning" };

export type FrameSample = {
  sceneId: string;
  timeSec: number;
  meanLuma: number;
  stdDev: number;
  ok: boolean;
  imagePath?: string;
};

export type VerificationReport = {
  ok: boolean;
  file: string;
  fileBytes: number;
  durationSec: number;
  container: string;
  video: { codec: string; width: number; height: number; fps: number; framesRead: number; framesExpected: number };
  audio: { codec: string; sampleRate: number; channels: number; durationSec: number };
  checks: VerifyCheck[];
  frameSamples: FrameSample[];
  avSync: number;
};

function run(cmd: string, args: string[], maxBuffer = 8 * 1024 * 1024): Promise<{ code: number; stdout: Buffer; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    let total = 0;
    let stderr = "";
    child.stdout?.on("data", (d: Buffer) => {
      total += d.length;
      if (total <= maxBuffer) chunks.push(d);
    });
    child.stderr?.on("data", (d) => (stderr += d.toString()));
    child.on("error", (e) => resolve({ code: -1, stdout: Buffer.alloc(0), stderr: String(e) }));
    child.on("close", (code) => resolve({ code: code ?? -1, stdout: Buffer.concat(chunks), stderr }));
  });
}

type ProbeStream = { codec_type: string; codec_name: string; width?: number; height?: number; avg_frame_rate?: string; r_frame_rate?: string; sample_rate?: string; channels?: number; duration?: string };
type ProbeResult = { streams: ProbeStream[]; format: { duration: string; format_name: string; size: string } };

async function probe(file: string, extra: string[] = []): Promise<ProbeResult> {
  const fp = findFfprobe();
  const r = await run(fp, ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", ...extra, file]);
  if (r.code !== 0) throw new Error(`ffprobe hatası: ${r.stderr.slice(0, 300)}`);
  return JSON.parse(r.stdout.toString("utf8")) as ProbeResult;
}

/** Kare ortalaması ve standart sapması: siyah/boş kare denetimi. */
async function frameStats(file: string, timeSec: number): Promise<{ mean: number; std: number }> {
  const ff = findFfmpeg();
  const r = await run(ff, ["-hide_banner", "-loglevel", "error", "-ss", timeSec.toFixed(3), "-i", file, "-frames:v", "1", "-vf", "scale=216:384", "-f", "rawvideo", "-pix_fmt", "gray", "-"]);
  const buf = r.stdout;
  if (!buf.length) return { mean: 0, std: 0 };
  let sum = 0;
  for (const v of buf) sum += v;
  const mean = sum / buf.length;
  let acc = 0;
  for (const v of buf) acc += (v - mean) ** 2;
  return { mean: Math.round(mean * 100) / 100, std: Math.round(Math.sqrt(acc / buf.length) * 100) / 100 };
}

/** Sahne ortasından kare çıkarır (görsel inceleme için). */
export async function extractFrame(file: string, timeSec: number, outPath: string): Promise<void> {
  const ff = findFfmpeg();
  ensureDir(path.dirname(outPath));
  const r = await run(ff, ["-hide_banner", "-loglevel", "error", "-y", "-ss", timeSec.toFixed(3), "-i", file, "-frames:v", "1", "-q:v", "2", outPath]);
  if (r.code !== 0) throw new Error(`Kare çıkarılamadı: ${r.stderr.slice(0, 300)}`);
}

/** Üretilen MP4'ü gerçekten çözerek doğrular. */
export async function verifyVideo(file: string, timeline: Timeline, opts: { frameDir?: string } = {}): Promise<VerificationReport> {
  const checks: VerifyCheck[] = [];
  const push = (id: string, ok: boolean, detail: string, severity: VerifyCheck["severity"] = "error") => checks.push({ id, ok, detail, severity });

  const exists = fs.existsSync(file);
  push("file_exists", exists, exists ? `Dosya var: ${file}` : `Dosya yok: ${file}`);
  const bytes = exists ? fs.statSync(file).size : 0;
  push("file_size", bytes > 50_000, `${(bytes / 1024 / 1024).toFixed(2)} MB`);
  if (!exists) {
    return {
      ok: false,
      file,
      fileBytes: bytes,
      durationSec: 0,
      container: "",
      video: { codec: "", width: 0, height: 0, fps: 0, framesRead: 0, framesExpected: timeline.frames },
      audio: { codec: "", sampleRate: 0, channels: 0, durationSec: 0 },
      checks,
      frameSamples: [],
      avSync: 0,
    };
  }

  const p = await probe(file);
  const v = p.streams.find((s) => s.codec_type === "video");
  const a = p.streams.find((s) => s.codec_type === "audio");
  const durationSec = Number.parseFloat(p.format.duration);

  // Gerçekten çözülen kare sayısı (konteyner meta verisi değil).
  const fp = findFfprobe();
  const counted = await run(fp, ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "default=nw=1:nk=1", file]);
  const framesRead = Number.parseInt(counted.stdout.toString().trim(), 10) || 0;

  const fps = v?.avg_frame_rate ? (() => {
    const [num, den] = v.avg_frame_rate!.split("/").map(Number);
    return den ? Math.round((num / den) * 100) / 100 : 0;
  })() : 0;

  push("container_mp4", p.format.format_name.includes("mp4"), p.format.format_name);
  push("video_stream", Boolean(v), v ? `${v.codec_name} ${v.width}x${v.height}` : "video akışı yok");
  push("video_codec_h264", v?.codec_name === "h264", v?.codec_name ?? "");
  push("resolution_1080x1920", v?.width === 1080 && v?.height === 1920, `${v?.width}x${v?.height}`, "warning");
  push("fps_30", Math.abs(fps - 30) < 0.02, `${fps}`);
  push(
    "frame_count_exact",
    framesRead === timeline.frames,
    `çözülen ${framesRead} / beklenen ${timeline.frames}`,
  );
  push(
    "duration_matches_target",
    Math.abs(durationSec - timeline.targetDurationSec) <= timeline.targetDurationSec * 0.05,
    `${durationSec.toFixed(2)} sn (hedef ${timeline.targetDurationSec} ±%5)`,
  );
  push("audio_stream", Boolean(a), a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels} kanal` : "ses akışı yok");
  push("audio_codec_aac", a?.codec_name === "aac", a?.codec_name ?? "");
  push("audio_sample_rate_48k", a?.sample_rate === "48000", a?.sample_rate ?? "");
  const audioDur = a?.duration ? Number.parseFloat(a.duration) : durationSec;
  const avSync = Math.abs(audioDur - durationSec);
  push("av_sync", avSync < 0.12, `ses ${audioDur.toFixed(3)} sn, video ${durationSec.toFixed(3)} sn, fark ${(avSync * 1000).toFixed(0)} ms`);

  const frameSamples: FrameSample[] = [];
  for (const scene of timeline.scenes) {
    const t = scene.startSec + Math.min(scene.durationSec * 0.55, 6.5);
    const stats = await frameStats(file, t);
    const imagePath = opts.frameDir ? path.join(opts.frameDir, `${scene.id}.jpg`) : undefined;
    if (imagePath) {
      try {
        await extractFrame(file, t, imagePath);
      } catch {
        /* görsel çıkarma başarısızsa doğrulamayı durdurma */
      }
    }
    const ok = stats.mean > 8 && stats.std > 3;
    frameSamples.push({ sceneId: scene.id, timeSec: Math.round(t * 100) / 100, meanLuma: stats.mean, stdDev: stats.std, ok, imagePath });
    push(`frame_visible_${scene.id}`, ok, `t=${t.toFixed(2)} sn, ortalama parlaklık ${stats.mean}, dağılım ${stats.std}`);
  }

  const ok = checks.every((c) => c.ok || c.severity === "warning") && framesRead === timeline.frames;
  return {
    ok,
    file,
    fileBytes: bytes,
    durationSec,
    container: p.format.format_name,
    video: { codec: v?.codec_name ?? "", width: v?.width ?? 0, height: v?.height ?? 0, fps, framesRead, framesExpected: timeline.frames },
    audio: { codec: a?.codec_name ?? "", sampleRate: Number.parseInt(a?.sample_rate ?? "0", 10), channels: a?.channels ?? 0, durationSec: audioDur },
    checks,
    frameSamples,
    avSync,
  };
}
