import type { Project, ProjectSummary, ResearchSummary, Scene } from "@nedenmis/core";

export type TtsStatus = {
  engine: string;
  label: string;
  available: boolean;
  detail: string;
  silent: boolean;
  state: "ready" | "downloading" | "unavailable" | "fallback";
};

export type Health = {
  ok: boolean;
  version: string;
  app: string;
  platform: string;
  node: string;
  cpus: number;
  memoryGb: number;
  dataDir: string;
  ffmpeg: string | null;
  ffprobe: string | null;
  fonts: { regular: string; bold: string } | null;
  db: "sqlite" | "json";
  tts: TtsStatus[];
  capabilities: { chatterbox: boolean; piper: boolean };
};

export type Job = {
  id: string;
  projectId: string;
  kind: "narration" | "render";
  status: "queued" | "running" | "done" | "failed";
  progress: number;
  stage: string;
  message: string;
  error?: { code: string; message: string; hint?: string; detail?: string };
  result?: Record<string, unknown>;
  events: { at: string; stage: string; progress: number; message: string; detail?: string }[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public hint?: string,
    public detail?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text.slice(0, 300) };
  }
  if (!res.ok) {
    const err = data as { error?: string; code?: string; hint?: string; detail?: unknown };
    throw new ApiError(err.error ?? `İstek başarısız (${res.status})`, res.status, err.code, err.hint, err.detail);
  }
  return data as T;
}

export type PlanInput = {
  topic: string;
  targetDurationSec: number;
  quality?: "draft" | "standard" | "high";
  languageLevel?: "simple" | "standard" | "detailed";
  visualComplexity?: "sade" | "dengeli" | "zengin";
  subtitles?: boolean;
  narration?: { engine?: string; voice?: string; rate?: number; chatterboxUrl?: string };
  fps?: number;
};

export const api = {
  health: () => request<Health>("/api/health"),
  topics: () => request<{ topics: { topic: string; cardId: string }[] }>("/api/topics"),
  resolve: (topic: string) => request<{ supported: boolean; title: string | null; confidence: number; reason: string; alternatives: { titleTr: string; score: number }[] }>("/api/topics/resolve", { method: "POST", body: JSON.stringify({ topic }) }),
  plan: (input: PlanInput) => request<{ project: Project; research: ResearchSummary; scenes: Scene[] }>("/api/plan", { method: "POST", body: JSON.stringify(input) }),
  create: (input: PlanInput) => request<{ project: Project }>("/api/projects", { method: "POST", body: JSON.stringify(input) }),
  list: () => request<{ projects: ProjectSummary[]; db: string }>("/api/projects"),
  get: (id: string) => request<{ project: Project; jobs: Job[] }>(`/api/projects/${id}`),
  remove: (id: string) => request<{ ok: boolean }>(`/api/projects/${id}`, { method: "DELETE" }),
  patch: (id: string, body: { narrationEdits?: Record<string, string>; order?: string[]; title?: string; quality?: "draft" | "standard" | "high" }) =>
    request<{ project: Project }>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  regenerate: (id: string, sceneId: string, componentId?: string) =>
    request<{ project: Project }>(`/api/projects/${id}/scenes/${sceneId}/regenerate`, { method: "POST", body: JSON.stringify({ componentId }) }),
  narrate: (id: string) => request<{ job: Job }>(`/api/projects/${id}/narrate`, { method: "POST", body: "{}" }),
  render: (id: string, quality?: string) => request<{ job: Job }>(`/api/projects/${id}/render`, { method: "POST", body: JSON.stringify({ quality }) }),
  job: (id: string) => request<{ job: Job }>(`/api/jobs/${id}`),
};

export const fileUrl = (id: string, artifact: string, download?: string) =>
  `/api/projects/${id}/files/${artifact}${download ? `?download=${encodeURIComponent(download)}&v=${Date.now()}` : `?v=${Date.now()}`}`;

export const scenePreviewUrl = (id: string, sceneId: string, at = 0.55, updatedAt = "") =>
  `/api/projects/${id}/scenes/${sceneId}/preview?at=${at}${updatedAt ? `&v=${encodeURIComponent(updatedAt)}` : ""}`;

export const sceneAudioUrl = (id: string, sceneId: string) => `/api/projects/${id}/scene-audio/${sceneId}`;
