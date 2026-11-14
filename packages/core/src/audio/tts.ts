import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDir, findFfprobe } from "../render/tools.js";

export type TtsEngineId = "chatterbox" | "piper" | "espeak" | "silent";

export type TtsConfig = {
  engine: TtsEngineId;
  /** Chatterbox sunucu adresi. */
  chatterboxUrl?: string;
  /** Chatterbox referans ses dosyası (isteğe bağlı). */
  voiceRef?: string;
  /** Piper ses modeli (.onnx) yolu. */
  piperModel?: string;
  /** espeak-ng hızı (kelime/dk). */
  rate?: number;
  /** Konuşmacı varyantı: espeak için "tr", "tr+f2" gibi. */
  voice?: string;
  python?: string;
};

export type TtsResult = {
  engine: TtsEngineId;
  audioPath: string;
  durationSec: number;
  sampleRate: number;
  warnings: string[];
};

export type TtsStatus = {
  engine: TtsEngineId;
  label: string;
  available: boolean;
  detail: string;
  /** Bu motorda sesin gerçekten üretildiği mi, yoksa sessiz mi olduğu. */
  silent: boolean;
};

export class TtsError extends Error {
  code: string;
  hint?: string;
  detail?: string;
  constructor(message: string, code: string, hint?: string, detail?: string) {
    super(message);
    this.name = "TtsError";
    this.code = code;
    this.hint = hint;
    this.detail = detail;
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));

function bridgeScript(): string {
  const resources = process.env.NEDENMIS_RESOURCES ?? (process as unknown as { resourcesPath?: string }).resourcesPath ?? "";
  const candidates = [
    path.resolve(here, "../../scripts/espeak_tts.py"),
    path.resolve(here, "../../../scripts/espeak_tts.py"),
    path.join(process.cwd(), "packages", "core", "scripts", "espeak_tts.py"),
    resources ? path.join(resources, "scripts", "espeak_tts.py") : "",
    path.join(here, "scripts", "espeak_tts.py"),
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new TtsError("espeak köprüsü bulunamadı (scripts/espeak_tts.py).", "TTS_BRIDGE_MISSING");
}

export function pythonCandidates(cfg?: TtsConfig): string[] {
  const out: string[] = [];
  if (cfg?.python) out.push(cfg.python);
  if (process.env.NEDENMIS_PYTHON) out.push(process.env.NEDENMIS_PYTHON);
  // Proje sanal ortamı ve paketlenmiş Python önce denenir.
  const packaged = (process as unknown as { resourcesPath?: string }).resourcesPath;
  const venvCandidates = [
    path.join(process.cwd(), ".venv", "bin", "python"),
    path.join(process.cwd(), ".venv", "Scripts", "python.exe"),
    path.join(process.cwd(), "vendor", "python", "python.exe"),
    packaged ? path.join(packaged, "python", "python.exe") : "",
    process.env.NEDENMIS_RESOURCES ? path.join(process.env.NEDENMIS_RESOURCES, "python", "python.exe") : "",
    process.env.NEDENMIS_RESOURCES ? path.join(process.env.NEDENMIS_RESOURCES, "python", "python") : "",
  ].filter(Boolean);
  for (const v of venvCandidates) if (fs.existsSync(v)) out.push(v);
  out.push("python3", "python", "py");
  return [...new Set(out)];
}

function run(cmd: string, args: string[], opts: { timeoutMs?: number; env?: NodeJS.ProcessEnv } = {}): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    const child = spawn(cmd, args, { env: { ...process.env, ...opts.env }, stdio: ["ignore", "pipe", "pipe"] });
    const timer = setTimeout(() => {
      if (!settled) {
        child.kill("SIGKILL");
      }
    }, opts.timeoutMs ?? 120_000);
    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));
    child.on("error", (e) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ code: -1, stdout, stderr: stderr + String(e.message) });
      }
    });
    child.on("close", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ code: code ?? -1, stdout, stderr });
      }
    });
  });
}

export async function measureAudio(file: string): Promise<number> {
  const probe = findFfprobe();
  const r = await run(probe, ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file], { timeoutMs: 20_000 });
  const dur = Number.parseFloat(r.stdout.trim());
  if (!Number.isFinite(dur) || dur <= 0) throw new TtsError(`Ses süresi okunamadı: ${path.basename(file)}`, "TTS_INVALID", r.stderr.slice(0, 300));
  return dur;
}

async function wavSampleRate(file: string): Promise<number> {
  const probe = findFfprobe();
  const r = await run(probe, ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate", "-of", "default=nw=1:nk=1", file], { timeoutMs: 20_000 });
  return Number.parseInt(r.stdout.trim(), 10) || 0;
}

async function espeakAvailable(cfg: TtsConfig): Promise<{ ok: boolean; detail: string; python?: string }> {
  let script: string;
  try {
    script = bridgeScript();
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
  let lastDetail = "Python bulunamadı.";
  for (const py of pythonCandidates(cfg)) {
    const r = await run(py, [script, "--check"], { timeoutMs: 25_000 });
    if (r.code === 0) return { ok: true, detail: r.stdout.trim() || "espeak-ng hazır", python: py };
    lastDetail = (r.stderr || r.stdout).trim().split("\n").slice(-2).join(" ") || lastDetail;
  }
  return { ok: false, detail: lastDetail };
}

async function chatterboxAvailable(cfg: TtsConfig): Promise<{ ok: boolean; detail: string }> {
  const url = cfg.chatterboxUrl ?? process.env.CHATTERBOX_URL ?? "http://127.0.0.1:8123";
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { ok: false, detail: `Chatterbox yanıtı: HTTP ${res.status}` };
    const body = (await res.json()) as { ok?: boolean; model?: string; language?: string };
    return { ok: Boolean(body.ok), detail: `Chatterbox hazır (${body.model ?? "model"}, ${body.language ?? "tr"})` };
  } catch (e) {
    return { ok: false, detail: `Chatterbox sunucusuna ulaşılamadı: ${(e as Error).message}` };
  }
}

export async function ttsStatus(cfg: TtsConfig): Promise<TtsStatus[]> {
  const esp = await espeakAvailable(cfg);
  const cb = await chatterboxAvailable(cfg);
  const piperOk = Boolean(cfg.piperModel && fs.existsSync(cfg.piperModel));
  return [
    {
      engine: "chatterbox",
      label: "Chatterbox Multilingual (Türkçe)",
      available: cb.ok,
      detail: cb.detail,
      silent: false,
    },
    {
      engine: "piper",
      label: "Piper (yerel nöral ses)",
      available: piperOk,
      detail: piperOk ? `Ses modeli: ${path.basename(cfg.piperModel!)}` : "Ses modeli (.onnx) tanımlı değil",
      silent: false,
    },
    {
      engine: "espeak",
      label: "eSpeak NG (çevrimdışı, robotik)",
      available: esp.ok,
      detail: esp.detail,
      silent: false,
    },
    { engine: "silent", label: "Sessiz (seslendirme yok)", available: true, detail: "Yalnızca açıkça istendiğinde kullanılır.", silent: true },
  ];
}

async function synthChatterbox(text: string, outPath: string, cfg: TtsConfig): Promise<TtsResult> {
  const url = (cfg.chatterboxUrl ?? process.env.CHATTERBOX_URL ?? "http://127.0.0.1:8123").replace(/\/$/, "");
  if (!(await chatterboxAvailable(cfg)).ok) {
    throw new TtsError(
      "Chatterbox sunucusu çalışmıyor.",
      "TTS_UNAVAILABLE",
      "Seslendirme sunucusunu başlatın: python packages/core/scripts/chatterbox_server.py — veya Ayarlar'dan başka bir seslendirme motoru seçin.",
    );
  }
  const res = await fetch(`${url}/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language_id: "tr", voice_ref: cfg.voiceRef ?? null }),
    signal: AbortSignal.timeout(600_000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new TtsError(`Chatterbox sentez hatası: HTTP ${res.status}`, "TTS_FAILED", body.slice(0, 400));
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new TtsError("Chatterbox geçersiz ses döndürdü.", "TTS_INVALID");
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, buf);
  const durationSec = await measureAudio(outPath);
  const sampleRate = await wavSampleRate(outPath);
  return { engine: "chatterbox", audioPath: outPath, durationSec, sampleRate, warnings: [] };
}

async function synthEspeak(text: string, outPath: string, cfg: TtsConfig): Promise<TtsResult> {
  const script = bridgeScript();
  const tmp = outPath.replace(/\.wav$/, ".txt");
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(tmp, text, "utf8");
  const errors: string[] = [];
  for (const py of pythonCandidates(cfg)) {
    const r = await run(
      py,
      [script, "--text-file", tmp, "--out", outPath, "--voice", cfg.voice ?? "tr", "--wpm", String(cfg.rate ?? 165)],
      { timeoutMs: 120_000 },
    );
    if (r.code === 0 && fs.existsSync(outPath)) {
      fs.rmSync(tmp, { force: true });
      const durationSec = await measureAudio(outPath);
      const sampleRate = await wavSampleRate(outPath);
      return { engine: "espeak", audioPath: outPath, durationSec, sampleRate, warnings: [] };
    }
    errors.push((r.stderr || r.stdout).trim().split("\n").slice(-2).join(" "));
  }
  throw new TtsError(
    "Yerel seslendirme (eSpeak NG) çalıştırılamadı.",
    "TTS_UNAVAILABLE",
    `Python ve espeakng-loader gerekli: pip install espeakng-loader. Ayrıntı: ${errors.filter(Boolean).slice(0, 2).join(" | ")}`,
  );
}

async function synthPiper(text: string, outPath: string, cfg: TtsConfig): Promise<TtsResult> {
  if (!cfg.piperModel || !fs.existsSync(cfg.piperModel)) {
    throw new TtsError("Piper ses modeli bulunamadı.", "TTS_UNAVAILABLE", "Ayarlar'dan geçerli bir .onnx ses modeli seçin.");
  }
  const tmp = outPath.replace(/\.wav$/, ".txt");
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(tmp, text, "utf8");
  const errors: string[] = [];
  for (const py of pythonCandidates(cfg)) {
    const r = await run(py, ["-m", "piper", "-m", cfg.piperModel, "-f", outPath, "--", text], { timeoutMs: 240_000 });
    if (r.code === 0 && fs.existsSync(outPath)) {
      fs.rmSync(tmp, { force: true });
      const durationSec = await measureAudio(outPath);
      return { engine: "piper", audioPath: outPath, durationSec, sampleRate: await wavSampleRate(outPath), warnings: [] };
    }
    errors.push((r.stderr || r.stdout).trim().slice(-200));
  }
  throw new TtsError("Piper çalıştırılamadı.", "TTS_UNAVAILABLE", errors.filter(Boolean).slice(0, 2).join(" | "));
}

async function synthSilent(text: string, outPath: string, cfg: TtsConfig): Promise<TtsResult> {
  // Sessiz mod yalnızca açıkça istendiğinde; süre tahminiyle sessiz WAV üretir.
  const words = text.trim().split(/\s+/).length;
  const durationSec = Math.max(2, words / 2.35 + 0.4);
  ensureDir(path.dirname(outPath));
  const ff = (await import("../render/tools.js")).findFfmpeg();
  const r = await run(ff, ["-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", durationSec.toFixed(2), "-c:a", "pcm_s16le", outPath], { timeoutMs: 60_000 });
  if (r.code !== 0) throw new TtsError("Sessiz ses üretilemedi.", "TTS_FAILED", r.stderr.slice(-300));
  return {
    engine: "silent",
    audioPath: outPath,
    durationSec,
    sampleRate: 48000,
    warnings: ["Sessiz mod: bu videoda seslendirme yok (kullanıcı tercihi)."],
  };
  void cfg;
}

export async function synthesize(text: string, outPath: string, cfg: TtsConfig): Promise<TtsResult> {
  if (!text.trim()) throw new TtsError("Boş anlatım seslendirilemez.", "TTS_EMPTY");
  switch (cfg.engine) {
    case "chatterbox":
      return synthChatterbox(text, outPath, cfg);
    case "piper":
      return synthPiper(text, outPath, cfg);
    case "espeak":
      return synthEspeak(text, outPath, cfg);
    case "silent":
      return synthSilent(text, outPath, cfg);
    default:
      throw new TtsError(`Bilinmeyen seslendirme motoru: ${String(cfg.engine)}`, "TTS_UNKNOWN");
  }
}
