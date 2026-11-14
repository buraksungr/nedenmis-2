import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { buildResearchSummary, getCard, resolveTopic } from "../ontology/resolve.js";
import type { KnowledgeCard } from "../ontology/types.js";
import { planScenes, buildScene } from "../visual/planner.js";
import { assertApproved, validatePlan, VisualValidationError, type ValidationReport } from "../visual/validate.js";
import type { Scene } from "../visual/spec.js";
import { buildTimeline, DurationError, type Timeline } from "../render/timeline.js";
import { renderFrameSvg } from "../render/svg.js";
import { svgToPng } from "../render/raster.js";
import { buildSrt, mixNarration, muxVideo, renderVideo, RenderError } from "../render/encode.js";
import { verifyVideo, type VerificationReport } from "../render/verify.js";
import { ensureDir } from "../render/tools.js";
import { synthesize, TtsError, type TtsEngineId } from "../audio/tts.js";
import type { ExportSettings, NarrationSettings, Project } from "./types.js";

export type PipelineStage = "research" | "script" | "scenes" | "validate" | "voice" | "render" | "mux" | "verify" | "done";

export type ProgressUpdate = {
  stage: PipelineStage;
  progress: number;
  message: string;
  detail?: string;
};

export class PipelineError extends Error {
  code: string;
  hint?: string;
  detail?: string;
  report?: ValidationReport;
  constructor(code: string, message: string, opts: { hint?: string; detail?: string; report?: ValidationReport } = {}) {
    super(message);
    this.name = "PipelineError";
    this.code = code;
    this.hint = opts.hint;
    this.detail = opts.detail;
    this.report = opts.report;
  }
}

export type CreateProjectInput = {
  topic: string;
  targetDurationSec: number;
  fps?: number;
  narration?: Partial<Project["narration"]>;
  quality?: "draft" | "standard" | "high";
};

export type PipelineOptions = {
  dataDir: string;
  narration: NarrationSettings;
  onProgress?: (u: ProgressUpdate) => void;
  log?: (message: string) => void;
  /** Test/önizleme için kare sınırı (nihai çıktıda kullanılmaz). */
  frameLimit?: number;
};

const QUALITY: Record<string, { width: number; crf: number; preset: string }> = {
  draft: { width: 540, crf: 27, preset: "ultrafast" },
  standard: { width: 1080, crf: 22, preset: "veryfast" },
  high: { width: 1080, crf: 18, preset: "medium" },
};

export function exportSettingsFor(quality: "draft" | "standard" | "high", fps = 30): ExportSettings {
  return { width: 1080, height: 1920, fps, videoCodec: "h264", audioCodec: "aac", audioSampleRate: 48000, quality };
}

export function projectDir(dataDir: string, id: string): string {
  return path.join(dataDir, "projects", id);
}

function narrationDefaults(input?: Partial<Project["narration"]>): Project["narration"] {
  return {
    engine: input?.engine ?? "espeak",
    voice: input?.voice ?? "tr",
    rate: input?.rate ?? 165,
    chatterboxUrl: input?.chatterboxUrl,
    voiceRef: input?.voiceRef,
    piperModel: input?.piperModel,
    audioFiles: {},
    measured: {},
    warnings: [],
  };
}

function scriptFromScenes(scenes: Scene[]): Project["script"] {
  const text = scenes.map((s) => s.narration.trim()).join(" ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return { text, wordCount, estimatedSec: Math.round((wordCount / 2.35) * 10) / 10, edited: false };
}

/** Konu → araştırma → senaryo → sahne planı → doğrulama. Ses üretmez. */
export function createProject(input: CreateProjectInput, onProgress?: (u: ProgressUpdate) => void): { project: Project; card: KnowledgeCard; planNotes: string[] } {
  const topic = input.topic.trim();
  if (topic.length < 5) throw new PipelineError("TOPIC_TOO_SHORT", "Konu en az 5 karakter olmalı.");
  onProgress?.({ stage: "research", progress: 0.05, message: "Konu bilimsel bilgi kartıyla eşleştiriliyor…" });

  let resolution;
  try {
    resolution = resolveTopic(topic);
  } catch (e) {
    throw new PipelineError("TOPIC_RESOLVE_FAILED", "Konu çözümlenemedi.", { detail: (e as Error).message });
  }
  if (!resolution.card) {
    throw new PipelineError("TOPIC_UNSUPPORTED", resolution.reason, {
      hint: "Doğrulanmış bilgi kartı olmayan konularda yanlış görsel üretmemek için üretim yapılmıyor.",
      detail: resolution.alternatives.map((a) => `${a.titleTr} (${a.score})`).join(", "),
    });
  }
  const card = resolution.card;
  const research = buildResearchSummary(card, topic, resolution.confidence);
  onProgress?.({ stage: "script", progress: 0.18, message: `Bilgi kartı: ${card.topicTitleTr}. Senaryo hazırlanıyor…` });

  const plan = planScenes(card, { targetDurationSec: input.targetDurationSec });
  onProgress?.({ stage: "scenes", progress: 0.34, message: `${plan.scenes.length} sahne planlandı; görsel mekanizmalar seçildi.` });

  const report = validatePlan(card, plan.scenes);
  onProgress?.({ stage: "validate", progress: 0.45, message: report.summary });
  if (report.status !== "approved") {
    const errs = report.checks.filter((c) => !c.ok && c.severity === "error");
    throw new PipelineError("VISUAL_VALIDATION_FAILED", report.summary, {
      hint: errs[0]?.message,
      report,
    });
  }

  const now = new Date().toISOString();
  const project: Project = {
    id: crypto.randomUUID(),
    topic,
    title: card.topicTitleTr,
    createdAt: now,
    updatedAt: now,
    status: "planned",
    stage: "planned",
    progress: 0.45,
    targetDurationSec: input.targetDurationSec,
    fps: input.fps ?? 30,
    research,
    script: scriptFromScenes(plan.scenes),
    scenes: report.scenes,
    narration: narrationDefaults(input.narration),
    timelineMeta: undefined,
    validation: { status: report.status, summary: report.summary, errors: report.errors, warnings: report.warnings },
    exportSettings: exportSettingsFor(input.quality ?? "draft", input.fps ?? 30),
    outputs: {},
    warnings: plan.notes,
    notes: [resolution.reason, `Eşleşme güveni: ${(resolution.confidence * 100).toFixed(0)}%`],
    topicConfidence: resolution.confidence,
    renderHistory: [],
  };
  return { project, card, planNotes: plan.notes };
}

/** Sahne anlatımlarını günceller ve doğrulamayı yeniden çalıştırır. */
export function applySceneNarration(project: Project, edits: Record<string, string>): Project {
  const card = getCard(project.research?.cardId ?? "");
  if (!card) throw new PipelineError("CARD_MISSING", "Proje bilgi kartı bulunamadı.");
  const scenes = project.scenes.map((s) => (edits[s.id] !== undefined ? { ...s, narration: edits[s.id] } : s));
  const report = validatePlan(card, scenes);
  return {
    ...project,
    scenes: report.scenes,
    script: { ...scriptFromScenes(report.scenes), edited: true },
    validation: { status: report.status, summary: report.summary, errors: report.errors, warnings: report.warnings },
    status: report.status === "rejected" ? "failed" : "validated",
    error: report.status === "rejected" ? { code: "VISUAL_VALIDATION_FAILED", message: report.summary } : undefined,
    updatedAt: new Date().toISOString(),
  };
}

/** Tek sahneyi yeniden planlar (senaryoyu değiştirmeden). */
export function regenerateSceneVisual(project: Project, sceneId: string, forceComponentId?: string): Project {
  const card = getCard(project.research?.cardId ?? "");
  if (!card) throw new PipelineError("CARD_MISSING", "Proje bilgi kartı bulunamadı.");
  const idx = project.scenes.findIndex((s) => s.id === sceneId);
  if (idx < 0) throw new PipelineError("SCENE_NOT_FOUND", `Sahne bulunamadı: ${sceneId}`);
  const current = project.scenes[idx];
  const step = card.steps.find((s) => s.id === current.stepId);
  if (!step) throw new PipelineError("STEP_NOT_FOUND", "Sahnenin mekanizma adımı bulunamadı.");
  const rebuilt = buildScene(card, step, idx, forceComponentId);
  // Kullanıcı düzenlemesi korunur.
  rebuilt.narration = current.narration;
  const scenes = project.scenes.map((s, i) => (i === idx ? rebuilt : s));
  const report = validatePlan(card, scenes);
  return {
    ...project,
    scenes: report.scenes,
    validation: { status: report.status, summary: report.summary, errors: report.errors, warnings: report.warnings },
    updatedAt: new Date().toISOString(),
  };
}

export function reorderScenes(project: Project, order: string[]): Project {
  const map = new Map(project.scenes.map((s) => [s.id, s]));
  const scenes = order.map((id, i) => {
    const s = map.get(id);
    if (!s) throw new PipelineError("SCENE_NOT_FOUND", `Sahne bulunamadı: ${id}`);
    return { ...s, index: i };
  });
  const card = getCard(project.research?.cardId ?? "");
  const report = card ? validatePlan(card, scenes) : undefined;
  return { ...project, scenes: report?.scenes ?? scenes, updatedAt: new Date().toISOString() };
}

/** Ölçülmüş ses sürelerinden zaman çizelgesi kurar. */
export function timelineFor(project: Project, opts: { targetDurationSec?: number; useAudio?: boolean } = {}): Timeline {
  const speechDurations = opts.useAudio === false ? undefined : project.narration.measured;
  return buildTimeline(project.scenes, {
    targetDurationSec: opts.targetDurationSec ?? project.targetDurationSec,
    fps: project.fps,
    speechDurations,
    audioPaths: project.narration.audioFiles,
  });
}

/** Her sahne için gerçek ses üretir ve süreleri ölçer. */
export async function narrateProject(project: Project, dataDir: string, onProgress?: (u: ProgressUpdate) => void): Promise<Project> {
  const dir = ensureDir(path.join(projectDir(dataDir, project.id), "audio"));
  const total = project.scenes.length;
  const baseRate = project.narration.rate ?? 165;

  const synthPass = async (rate: number, tag: string) => {
    const measured: Record<string, number> = {};
    const audioFiles: Record<string, string> = {};
    const warnings: string[] = [];
    let engineUsed: TtsEngineId | undefined;
    for (let i = 0; i < total; i++) {
      const scene = project.scenes[i];
      const out = path.join(dir, `${String(i + 1).padStart(2, "0")}-${scene.id}${tag}.wav`);
      onProgress?.({
        stage: "voice",
        progress: 0.45 + (i / total) * 0.25,
        message: `Seslendirme: sahne ${i + 1}/${total}${tag ? " (tempo ayarı)" : ""}`,
        detail: scene.narration.slice(0, 80),
      });
      try {
        const result = await synthesize(scene.narration, out, {
          engine: project.narration.engine,
          voice: project.narration.voice,
          rate,
          chatterboxUrl: project.narration.chatterboxUrl,
          voiceRef: project.narration.voiceRef,
          piperModel: project.narration.piperModel,
        });
        measured[scene.id] = Math.round(result.durationSec * 1000) / 1000;
        audioFiles[scene.id] = result.audioPath;
        warnings.push(...result.warnings);
        engineUsed = result.engine;
      } catch (e) {
        const err = e as TtsError;
        throw new PipelineError(err.code ?? "TTS_FAILED", err.message, { hint: err.hint, detail: err.detail });
      }
    }
    return { measured, audioFiles, warnings, engineUsed, rate };
  };

  let pass = await synthPass(baseRate, "");
  let speechTotal = Object.values(pass.measured).reduce((a, b) => a + b, 0);

  // Anlatım hedefin belirgin altındaysa sahne germek yerine konuşma temposunu düşür.
  const raisable = project.narration.engine === "espeak" || project.narration.engine === "piper";
  if (raisable && speechTotal < project.targetDurationSec * 0.9) {
    const desired = Math.round((baseRate * speechTotal) / (project.targetDurationSec * 0.96));
    const newRate = Math.max(105, Math.min(baseRate - 5, desired));
    if (newRate >= 105) {
      pass = await synthPass(newRate, `-r${newRate}`);
      speechTotal = Object.values(pass.measured).reduce((a, b) => a + b, 0);
    }
  }

  const timeline = buildTimeline(project.scenes, {
    targetDurationSec: project.targetDurationSec,
    fps: project.fps,
    speechDurations: pass.measured,
    audioPaths: pass.audioFiles,
    maxHoldPerScene: 1.6,
  });

  return {
    ...project,
    status: "narrated",
    stage: "narrated",
    progress: 0.72,
    narration: {
      ...project.narration,
      rate: pass.rate,
      measured: pass.measured,
      audioFiles: pass.audioFiles,
      engineUsed: pass.engineUsed,
      warnings: [...new Set(pass.warnings)],
    },
    timelineMeta: {
      durationSec: timeline.durationSec,
      frames: timeline.frames,
      fps: timeline.fps,
      withinTolerance: timeline.withinTolerance,
      subtitleTiming: timeline.subtitleTiming,
      warnings: timeline.warnings,
    },
    warnings: [...new Set([...project.warnings, ...timeline.warnings])],
    updatedAt: new Date().toISOString(),
  };
}

export type RenderResult = {
  project: Project;
  timeline: Timeline;
  verification: VerificationReport;
  videoPath: string;
};

/** Zaman çizelgesini gerçek MP4'e dönüştürür ve doğrular. */
export async function renderProject(project: Project, dataDir: string, opts: PipelineOptions): Promise<RenderResult> {
  const card = getCard(project.research?.cardId ?? "");
  if (!card) throw new PipelineError("CARD_MISSING", "Proje bilgi kartı bulunamadı.");

  // Kapı: doğrulanmamış plan render edilemez.
  const report = assertApproved(card, project.scenes);

  const timeline = timelineFor(project);
  if (opts.frameLimit) {
    // Yalnızca test/önizleme: son kareye kadar süre korunmaz.
  }
  const quality = QUALITY[project.exportSettings.quality] ?? QUALITY.draft;
  const base = ensureDir(projectDir(dataDir, project.id));
  const renderDir = ensureDir(path.join(base, "render"));
  const outDir = ensureDir(path.join(base, "out"));
  const reportDir = ensureDir(path.join(base, "reports"));
  const framesDir = ensureDir(path.join(reportDir, "frames"));

  const videoOnly = path.join(renderDir, "video-only.mp4");
  const audioPath = path.join(renderDir, "narration.wav");
  const finalPath = path.join(outDir, `${project.id.slice(0, 8)}-${card.id}-${project.targetDurationSec}s.mp4`);
  const qualityWidth = project.exportSettings.quality === "draft" ? quality.width : 1080;

  opts.onProgress?.({ stage: "render", progress: 0.73, message: `Kareler üretiliyor (${timeline.frames} kare, ${qualityWidth}px)…` });

  await renderVideo({
    timeline,
    outPath: videoOnly,
    width: qualityWidth,
    crf: quality.crf,
    preset: quality.preset,
    frameRange: opts.frameLimit ? [0, Math.min(opts.frameLimit, timeline.frames)] : undefined,
    onProgress: (done, total, fps) => {
      opts.onProgress?.({
        stage: "render",
        progress: 0.73 + (done / total) * 0.17,
        message: `Kareler üretiliyor: ${done}/${total}`,
        detail: `${fps.toFixed(1)} kare/sn`,
      });
    },
  });

  opts.onProgress?.({ stage: "mux", progress: 0.91, message: "Ses ve görüntü birleştiriliyor…" });
  await mixNarration(timeline, audioPath);
  await muxVideo(videoOnly, audioPath, finalPath);

  opts.onProgress?.({ stage: "verify", progress: 0.95, message: "Çıktı FFprobe ile doğrulanıyor…" });
  const verification = await verifyVideo(finalPath, timeline, { frameDir: framesDir });

  // Altyazı ve rapor dosyaları.
  const srtPath = path.join(outDir, `${path.basename(finalPath, ".mp4")}.srt`);
  fs.writeFileSync(srtPath, buildSrt(timeline), "utf8");
  const verificationPath = path.join(reportDir, "verification.json");
  fs.writeFileSync(verificationPath, JSON.stringify(verification, null, 2), "utf8");
  const validationPath = path.join(reportDir, "visual-validation.json");
  fs.writeFileSync(
    validationPath,
    JSON.stringify(
      {
        projectId: project.id,
        topic: project.topic,
        cardId: card.id,
        status: report.status,
        summary: report.summary,
        errors: report.errors,
        warnings: report.warnings,
        scenes: report.scenes.map((s) => ({ id: s.id, component: s.spec.componentId, mechanism: s.spec.mechanism, status: s.validation.status, score: s.validation.score, checks: s.validation.checks })),
      },
      null,
      2,
    ),
    "utf8",
  );

  // Poster (ilk sahnenin ilk saniyesi).
  const posterPath = path.join(reportDir, "poster.png");
  try {
    const svg = renderFrameSvg(timeline, Math.min(1, timeline.durationSec / 2), { showSubtitles: false });
    fs.writeFileSync(posterPath, svgToPng(svg, { width: 540 }));
  } catch {
    /* poster kritik değil */
  }
  try {
    fs.rmSync(videoOnly, { force: true });
  } catch {
    /* yok say */
  }

  const updated: Project = {
    ...project,
    status: "ready",
    stage: "ready",
    progress: 1,
    validation: { status: report.status, summary: report.summary, errors: report.errors, warnings: report.warnings },
    verification,
    timelineMeta: {
      durationSec: timeline.durationSec,
      frames: timeline.frames,
      fps: timeline.fps,
      withinTolerance: timeline.withinTolerance,
      subtitleTiming: timeline.subtitleTiming,
      warnings: timeline.warnings,
    },
    outputs: { videoPath: finalPath, audioPath, srtPath, verificationPath, validationPath, framesDir, posterPath },
    warnings: [...new Set([...project.warnings, ...timeline.warnings])],
    renderHistory: [
      ...project.renderHistory,
      { at: new Date().toISOString(), durationSec: verification.durationSec, ok: verification.ok, file: finalPath },
    ],
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(base, "project.json"), JSON.stringify(updated, null, 2), "utf8");
  opts.onProgress?.({ stage: "done", progress: 1, message: verification.ok ? "Video hazır ve doğrulandı." : "Video üretildi ancak doğrulama uyarıları var." });
  return { project: updated, timeline, verification, videoPath: finalPath };
}

/** Uçtan uca: araştırma → senaryo → sahneler → doğrulama → ses → render → doğrulama raporu. */
export async function runPipeline(input: CreateProjectInput, opts: PipelineOptions): Promise<RenderResult> {
  const { project, card } = createProject(input, opts.onProgress);
  const dir = ensureDir(projectDir(opts.dataDir, project.id));
  fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify(project, null, 2), "utf8");
  opts.log?.(`Proje oluşturuldu: ${project.id} — ${card.id}`);

  const narrated = await narrateProject(project, opts.dataDir, opts.onProgress);
  fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify(narrated, null, 2), "utf8");

  const result = await renderProject(narrated, opts.dataDir, opts);
  opts.log?.(`Render tamamlandı: ${result.videoPath} (${result.verification.durationSec.toFixed(2)} sn)`);
  return result;
}

export { DurationError, VisualValidationError, RenderError, TtsError };
