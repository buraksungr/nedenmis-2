import { z } from "zod";
import type { Domain, KnowledgeCard } from "../ontology/types.js";

export const ParamValueSchema = z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]);

export const SceneVisualSpecSchema = z.object({
  componentId: z.string().min(1),
  mechanism: z.string().min(1),
  params: z.record(ParamValueSchema),
  concepts: z.array(z.string()),
  labels: z.array(z.string()),
  camera: z.enum(["static", "zoom_in", "zoom_out", "pan_left", "pan_right"]),
  background: z.string(),
  rationale: z.string(),
  scientificNote: z.string(),
});

export type SceneVisualSpec = z.infer<typeof SceneVisualSpecSchema>;

export type ValidationCheck = {
  code: string;
  severity: "error" | "warning" | "info";
  ok: boolean;
  message: string;
};

export type SceneValidation = {
  status: "approved" | "rejected";
  checks: ValidationCheck[];
  score: number;
};

export type Scene = {
  id: string;
  index: number;
  /** Bilgi kartındaki mekanizma adımı. */
  stepId: string;
  narration: string;
  /** Aynı sahnenin bilimsel/ayrıntılı anlatımı (doğrulama ve "ayrıntılı" düzey için saklanır). */
  narrationScientific?: string;
  conceptIds: string[];
  conceptLabels: string[];
  domain: Domain;
  visualObjective: string;
  overlay: string;
  spec: SceneVisualSpec;
  minDuration: number;
  optional: boolean;
  transition: "crossfade" | "dip" | "slide";
  validation: SceneValidation;
  /** Seslendirme sonrası doldurulur. */
  speechDurationSec?: number;
  startSec?: number;
  durationSec?: number;
};

// Türkçe eSpeak NG 165 kelime/dk ≈ 2.75 kelime/sn; cümle sonu duraklamaları ayrıca eklenir.
// (Eski 2.35 değeri süreyi ~%30 abartıyor, sahne seçiminde gereksiz sahne atılmasına yol açıyordu.)
export const DEFAULT_NARRATION_WPS = 2.6;

export function estimateSpeechSeconds(text: string, wps = DEFAULT_NARRATION_WPS): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const punctuation = (text.match(/[.?!,;:]/g) ?? []).length;
  return words / wps + punctuation * 0.12 + 0.25;
}

export function sceneTtsText(card: KnowledgeCard, scene: Scene): string {
  return card.id ? scene.narration : scene.narration;
}
