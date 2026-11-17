import type { ResearchSummary } from "../ontology/types.js";
import type { Scene } from "../visual/spec.js";
import type { VerificationReport } from "../render/verify.js";
import type { TtsEngineId } from "../audio/tts.js";
import type { LanguageLevel, ScriptQuality } from "../script/style.js";

export type NarrationSettings = {
  engine: TtsEngineId;
  voice?: string;
  rate?: number;
  chatterboxUrl?: string;
  voiceRef?: string;
  piperModel?: string;
};

export type ExportSettings = {
  width: number;
  height: number;
  fps: number;
  videoCodec: "h264";
  audioCodec: "aac";
  audioSampleRate: 48000;
  quality: "draft" | "standard" | "high";
  /** Altyazı çizilsin mi (varsayılan: evet). */
  subtitles?: boolean;
};

export type ProjectStatus = "planned" | "validated" | "narrated" | "rendering" | "ready" | "failed";

export type ProjectOutputs = {
  videoPath?: string;
  audioPath?: string;
  srtPath?: string;
  verificationPath?: string;
  validationPath?: string;
  framesDir?: string;
  posterPath?: string;
};

export type Project = {
  id: string;
  topic: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  stage: string;
  progress: number;
  error?: { code: string; message: string; hint?: string; detail?: string };
  targetDurationSec: number;
  fps: number;
  /** Senaryo dil düzeyi (varsayılan: sade). */
  languageLevel: LanguageLevel;
  /** Görsel karmaşıklığı: sade = az etiket, zengin = daha çok etiket. */
  visualComplexity?: "sade" | "dengeli" | "zengin";
  /** Senaryo kalite ölçümü (cümle uzunluğu, terim yoğunluğu, kanca…). */
  scriptQuality?: ScriptQuality;
  research?: ResearchSummary;
  script: {
    text: string;
    wordCount: number;
    estimatedSec: number;
    edited: boolean;
  };
  scenes: Scene[];
  narration: NarrationSettings & {
    engineUsed?: TtsEngineId;
    audioFiles: Record<string, string>;
    measured: Record<string, number>;
    warnings: string[];
  };
  timelineMeta?: {
    durationSec: number;
    frames: number;
    fps: number;
    withinTolerance: boolean;
    subtitleTiming: "phrase-estimated" | "word-aligned";
    warnings: string[];
  };
  validation?: {
    status: "approved" | "rejected";
    summary: string;
    errors: number;
    warnings: number;
  };
  verification?: VerificationReport;
  exportSettings: ExportSettings;
  outputs: ProjectOutputs;
  warnings: string[];
  notes: string[];
  topicConfidence: number;
  renderHistory: { at: string; durationSec: number; ok: boolean; file?: string; note?: string }[];
};

export type ProjectSummary = {
  id: string;
  topic: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  durationSec: number;
  targetDurationSec: number;
  thumbnail?: string;
  videoPath?: string;
  validation?: "approved" | "rejected";
  engineUsed?: string;
};

export function summarizeProject(p: Project): ProjectSummary {
  return {
    id: p.id,
    topic: p.topic,
    title: p.title,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    status: p.status,
    durationSec: p.timelineMeta?.durationSec ?? 0,
    targetDurationSec: p.targetDurationSec,
    thumbnail: p.outputs.posterPath,
    videoPath: p.outputs.videoPath,
    validation: p.validation?.status,
    engineUsed: p.narration.engineUsed,
  };
}
