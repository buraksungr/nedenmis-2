import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { renderFrameSvg, type FrameOptions } from "./svg.js";
import { svgToPng } from "./raster.js";
import { ensureDir, findFfmpeg } from "./tools.js";
import type { Timeline } from "./timeline.js";

export class RenderError extends Error {
  detail: string;
  constructor(message: string, detail = "") {
    super(message);
    this.name = "RenderError";
    this.detail = detail;
  }
}

export type VideoRenderOptions = {
  timeline: Timeline;
  outPath: string;
  width?: number;
  crf?: number;
  preset?: string;
  frameOptions?: FrameOptions;
  onProgress?: (done: number, total: number, fps: number) => void;
  /** Belirli aralık (kısmi render / test). */
  frameRange?: [number, number];
};

function ffmpegArgs(timeline: Timeline, outPath: string, width: number, crf: number, preset: string): string[] {
  return [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "image2pipe",
    "-framerate",
    String(timeline.fps),
    "-i",
    "-",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    preset,
    "-crf",
    String(crf),
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(timeline.fps),
    "-g",
    String(timeline.fps * 2),
    "-movflags",
    "+faststart",
    "-vf",
    `scale=${width}:${Math.round((width * 16) / 9)}`,
    outPath,
  ];
}

/** Kareleri PNG olarak ffmpeg'e akıtır (bellekte tüm video tutulmaz). */
export async function renderVideo(opts: VideoRenderOptions): Promise<{ frames: number; elapsedMs: number; width: number }> {
  const { timeline } = opts;
  const width = opts.width ?? 1080;
  const crf = opts.crf ?? 19;
  const preset = opts.preset ?? "veryfast";
  const outPath = opts.outPath;
  ensureDir(path.dirname(outPath));
  const [from, to] = opts.frameRange ?? [0, timeline.frames];

  const ff = findFfmpeg();
  const started = Date.now();
  const child = spawn(ff, ffmpegArgs(timeline, outPath, width, crf, preset), { stdio: ["pipe", "ignore", "pipe"] });
  let stderr = "";
  child.stderr?.on("data", (d) => (stderr += d.toString()));

  const done = new Promise<number>((resolve, reject) => {
    child.on("error", (e) => reject(new RenderError("FFmpeg başlatılamadı.", String(e))));
    child.on("close", (code) => {
      if (code === 0) resolve(code);
      else reject(new RenderError(`FFmpeg çıkış kodu ${code}.`, stderr.slice(-1200)));
    });
  });

  try {
    for (let f = from; f < to; f++) {
      const t = f / timeline.fps;
      const svg = renderFrameSvg(timeline, t, opts.frameOptions);
      const png = svgToPng(svg, { width });
      if (!child.stdin!.write(png)) {
        await new Promise<void>((resolve, reject) => {
          child.stdin!.once("drain", resolve);
          child.stdin!.once("error", reject);
        });
      }
      if (opts.onProgress && (f - from) % 15 === 0) {
        const elapsed = (Date.now() - started) / 1000;
        opts.onProgress(f - from + 1, to - from, (f - from + 1) / Math.max(0.001, elapsed));
      }
    }
    child.stdin!.end();
    await done;
  } catch (e) {
    child.kill("SIGKILL");
    throw e;
  }

  if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 1000) {
    throw new RenderError("Video dosyası oluşmadı veya boş.", stderr.slice(-800));
  }
  opts.onProgress?.(to - from, to - from, 0);
  return { frames: to - from, elapsedMs: Date.now() - started, width };
}

function run(cmd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));
    child.on("error", (e) => resolve({ code: -1, stdout, stderr: stderr + String(e) }));
    child.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

/**
 * Sahne seslerini zaman çizelgesine göre tek 48 kHz parçaya birleştirir.
 *
 * Sahneler sıralıdır; her sahne kendi süresine örnek-hassas doldurulur
 * (adelay + apad + -t) ve concat demuxer ile birleştirilir. Böylece amix'in
 * normalize davranışına veya yeni FFmpeg seçeneklerine bağımlılık olmaz.
 */
export async function mixNarration(timeline: Timeline, outPath: string): Promise<void> {
  const ff = findFfmpeg();
  ensureDir(path.dirname(outPath));
  const tmpDir = ensureDir(path.join(path.dirname(outPath), "mix-tmp"));
  const list: string[] = [];

  for (let i = 0; i < timeline.scenes.length; i++) {
    const s = timeline.scenes[i];
    const dur = s.durationSec.toFixed(3);
    const delayMs = String(Math.max(0, Math.round(s.speechStart * 1000)));
    const target = path.join(tmpDir, `${String(i + 1).padStart(2, "0")}.wav`);
    const hasAudio = Boolean(s.audioPath && fs.existsSync(s.audioPath));
    const args = hasAudio
      ? ["-y", "-hide_banner", "-loglevel", "error", "-i", s.audioPath!, "-af", `aformat=channel_layouts=mono,aresample=48000,adelay=${delayMs},apad`, "-t", dur, "-c:a", "pcm_s16le", target]
      : ["-y", "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", dur, "-c:a", "pcm_s16le", target];
    const r = await run(ff, args);
    if (r.code !== 0) throw new RenderError(`Sahne sesi hazırlanamadı (${s.id}).`, r.stderr.slice(-600));
    list.push(path.resolve(target).replace(/\\/g, "/"));
  }

  const listFile = path.join(tmpDir, "concat.txt");
  fs.writeFileSync(listFile, list.map((f) => `file '${f}'`).join("\n"), "utf8");
  const r = await run(ff, [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listFile,
    "-af",
    "apad",
    "-t",
    timeline.durationSec.toFixed(3),
    "-c:a",
    "pcm_s16le",
    "-ar",
    "48000",
    "-ac",
    "1",
    outPath,
  ]);
  if (r.code !== 0) throw new RenderError("Ses birleştirme başarısız.", r.stderr.slice(-1200));
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

/** Videoyu sesle birleştirir; video yeniden kodlanmaz. */
export async function muxVideo(videoPath: string, audioPath: string, outPath: string): Promise<void> {
  const ff = findFfmpeg();
  ensureDir(path.dirname(outPath));
  const r = await run(ff, [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    videoPath,
    "-i",
    audioPath,
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
    "-shortest",
    "-movflags",
    "+faststart",
    outPath,
  ]);
  if (r.code !== 0) throw new RenderError("Video ve ses birleştirilemedi.", r.stderr.slice(-1200));
}

/** Altyazı dosyası (SRT). Zamanlama ifade düzeyinde ve tahminidir — kelime hizalaması yok. */
export function buildSrt(timeline: Timeline): string {
  const fmt = (s: number) => {
    const ms = Math.round(s * 1000);
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const sec = Math.floor((ms % 60_000) / 1000);
    const r = ms % 1000;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(r).padStart(3, "0")}`;
  };
  let i = 1;
  let out = "";
  for (const s of timeline.scenes) {
    for (const c of s.chunks) {
      out += `${i++}\n${fmt(c.start)} --> ${fmt(c.end)}\n${c.text}\n\n`;
    }
  }
  return out.trim() + "\n";
}
