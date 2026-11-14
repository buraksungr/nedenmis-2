import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import {
  applySceneNarration,
  createProject,
  findFfmpeg,
  findFfprobe,
  findFonts,
  getCard,
  narrateProject,
  ProjectStore,
  regenerateSceneVisual,
  renderProject,
  reorderScenes,
  renderFrameSvg,
  timelineFor,
  resolveTopic,
  suggestedTopics,
  summarizeProject,
  ttsStatus,
  validatePlan,
  VISUAL_COMPONENTS,
  planScenes,
  type CreateProjectInput,
  type NarrationSettings,
  type Project,
  type ProgressUpdate,
} from "@nedenmis/core";
import { HttpError, json, readJson, safeJoin, sendFile, type Ctx } from "./http.js";
import { JobManager } from "./jobs.js";

export type StudioServerOptions = {
  dataDir: string;
  uiDir?: string;
  host?: string;
  port?: number;
  narration?: Partial<NarrationSettings>;
  version?: string;
};

type Route = {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: (ctx: Ctx) => Promise<void> | void;
};

function route(method: string, pattern: string, handler: (ctx: Ctx) => Promise<void> | void): Route {
  const keys: string[] = [];
  const regex = new RegExp(
    "^" +
      pattern
        .split("/")
        .map((seg) => {
          if (seg.startsWith(":")) {
            keys.push(seg.slice(1));
            return "([^/]+)";
          }
          return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("/") +
      "$",
  );
  return { method, pattern: regex, keys, handler };
}

export function createStudioServer(opts: StudioServerOptions) {
  const dataDir = path.resolve(opts.dataDir);
  const store = new ProjectStore(path.join(dataDir, "db"));
  const jobs = new JobManager({
    onUpdate: (job) => {
      const p = store.get(job.projectId);
      if (!p) return;
      const status: Project["status"] = job.status === "failed" ? "failed" : job.status === "done" ? p.status : "rendering";
      store.upsert({
        ...p,
        status,
        stage: job.stage,
        progress: Math.max(p.progress, job.progress),
        error: job.status === "failed" ? job.error : undefined,
      });
    },
  });

  const uiDir = opts.uiDir ? path.resolve(opts.uiDir) : path.join(process.cwd(), "packages", "ui", "dist");
  const version = opts.version ?? "1.0.0";
  const defaultNarration: Partial<NarrationSettings> = opts.narration ?? {};

  const load = (id: string): Project => {
    const p = store.get(id);
    if (!p) throw new HttpError(404, "Proje bulunamadı.");
    return p;
  };

  const progressToJob = (emit: (e: Partial<{ stage: string; progress: number; message: string; detail?: string }>) => void) => (u: ProgressUpdate) =>
    emit({ stage: u.stage, progress: u.progress, message: u.message, detail: u.detail });

  const routes: Route[] = [
    route("GET", "/api/health", async ({ res }) => {
      const tts = await ttsStatus({ engine: defaultNarration.engine ?? "espeak", voice: defaultNarration.voice ?? "tr" });
      json(res, 200, {
        ok: true,
        version,
        app: "Nedenmiş Studio",
        platform: `${process.platform}-${process.arch}`,
        node: process.version,
        cpus: os.cpus().length,
        memoryGb: Math.round((os.totalmem() / 1024 ** 3) * 10) / 10,
        dataDir,
        ffmpeg: safe(() => findFfmpeg()),
        ffprobe: safe(() => findFfprobe()),
        fonts: safe(() => findFonts()),
        db: store.backend,
        tts,
        capabilities: {
          chatterbox: Boolean(process.env.CHATTERBOX_URL || defaultNarration.chatterboxUrl),
          piper: Boolean(process.env.PIPER_MODEL || defaultNarration.piperModel),
        },
      });
    }),

    route("GET", "/api/topics", ({ res }) => {
      json(res, 200, { topics: suggestedTopics() });
    }),

    route("POST", "/api/topics/resolve", async ({ res, body }) => {
      const { topic } = (body ?? {}) as { topic?: string };
      if (!topic || topic.trim().length < 5) throw new HttpError(400, "Konu en az 5 karakter olmalı.");
      const resolution = resolveTopic(String(topic));
      json(res, 200, {
        topic,
        cardId: resolution.card?.id ?? null,
        title: resolution.card?.topicTitleTr ?? null,
        domains: resolution.card?.domains ?? null,
        confidence: resolution.confidence,
        reason: resolution.reason,
        alternatives: resolution.alternatives,
        supported: Boolean(resolution.card),
      });
    }),

    // Planlama: render etmeden sahne planı + doğrulama raporu üretir.
    route("POST", "/api/plan", async ({ res, body }) => {
      const input = (body ?? {}) as CreateProjectInput;
      const { project } = createProject(
        { ...input, narration: { ...defaultNarration, ...(input.narration ?? {}) } },
      );
      json(res, 200, { project, research: project.research, scenes: project.scenes });
    }),

    route("POST", "/api/projects", async ({ res, body }) => {
      const input = (body ?? {}) as CreateProjectInput;
      if (!input.topic) throw new HttpError(400, "Konu gerekli.");
      const duration = Number(input.targetDurationSec ?? 60);
      if (!Number.isFinite(duration) || duration < 20 || duration > 300) throw new HttpError(400, "Süre 20–300 saniye arasında olmalı.");
      const { project } = createProject({ ...input, targetDurationSec: duration, narration: { ...defaultNarration, ...(input.narration ?? {}) } });
      const saved = store.upsert(project);
      store.log(saved.id, "info", `Plan oluşturuldu: ${saved.topic} (${saved.research?.cardId})`);
      json(res, 201, { project: saved });
    }),

    route("GET", "/api/projects", ({ res }) => {
      json(res, 200, { projects: store.list(), db: store.backend });
    }),

    route("GET", "/api/projects/:id", ({ res, params }) => {
      const p = load(params.id);
      json(res, 200, { project: p, jobs: jobs.list(p.id).slice(0, 8) });
    }),

    route("DELETE", "/api/projects/:id", ({ res, params }) => {
      load(params.id);
      store.delete(params.id);
      json(res, 200, { ok: true });
    }),

    // Anlatım düzenleme / sahne sırası.
    route("PATCH", "/api/projects/:id", async ({ res, params, body }) => {
      const p = load(params.id);
      const patch = (body ?? {}) as { narrationEdits?: Record<string, string>; order?: string[]; title?: string; quality?: Project["exportSettings"]["quality"] };
      let next = p;
      if (patch.narrationEdits) next = applySceneNarration(next, patch.narrationEdits);
      if (patch.order) next = reorderScenes(next, patch.order);
      if (patch.title) next = { ...next, title: patch.title };
      if (patch.quality) next = { ...next, exportSettings: { ...next.exportSettings, quality: patch.quality } };
      next = { ...next, script: { ...next.script, edited: Boolean(patch.narrationEdits) || next.script.edited } };
      const saved = store.upsert(next);
      json(res, 200, { project: saved });
    }),

    // Tek sahneyi yeniden üret (görsel veya anlatım).
    route("POST", "/api/projects/:id/scenes/:sceneId/regenerate", async ({ res, params, body }) => {
      const p = load(params.id);
      const { componentId } = (body ?? {}) as { componentId?: string };
      const next = regenerateSceneVisual(p, params.sceneId, componentId);
      const saved = store.upsert(next);
      json(res, 200, { project: saved });
    }),

    route("POST", "/api/projects/:id/narrate", async ({ res, params }) => {
      const p = load(params.id);
      const active = jobs.findActive(p.id);
      if (active) throw new HttpError(409, `Bu projede zaten çalışan bir iş var (${active.kind}).`);
      const job = jobs.enqueue(p.id, "narration", async ({ emit }) => {
        const narrated = await narrateProject(p, dataDir, progressToJob(emit));
        store.upsert(narrated);
        return { durationSec: narrated.timelineMeta?.durationSec ?? 0, engineUsed: narrated.narration.engineUsed };
      });
      json(res, 202, { job });
    }),

    route("POST", "/api/projects/:id/render", async ({ res, params, body }) => {
      const p = load(params.id);
      const active = jobs.findActive(p.id);
      if (active) throw new HttpError(409, `Bu projede zaten çalışan bir iş var (${active.kind}).`);
      const { quality } = (body ?? {}) as { quality?: Project["exportSettings"]["quality"] };
      const queued: Project = quality ? { ...p, exportSettings: { ...p.exportSettings, quality } } : p;
      store.upsert({ ...queued, status: "rendering", stage: "queued", progress: 0.5 });
      const job = jobs.enqueue(p.id, "render", async ({ emit }) => {
        const current = load(p.id);
        const result = await renderProject(current, dataDir, { dataDir, narration: current.narration, onProgress: progressToJob(emit) });
        store.upsert(result.project);
        store.log(p.id, "info", `Render tamamlandı: ${result.videoPath}`);
        return {
          videoPath: result.videoPath,
          durationSec: result.verification.durationSec,
          ok: result.verification.ok,
          checks: result.verification.checks.filter((c) => !c.ok).map((c) => c.id),
        };
      });
      json(res, 202, { job });
    }),

    route("GET", "/api/jobs/:id", ({ res, params }) => {
      const job = jobs.get(params.id);
      if (!job) throw new HttpError(404, "İş bulunamadı.");
      json(res, 200, { job });
    }),

    route("GET", "/api/jobs/:id/events", ({ req, res, params }) => {
      const job = jobs.get(params.id);
      if (!job) throw new HttpError(404, "İş bulunamadı.");
      res.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      });
      const send = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);
      send(job);
      const off = jobs.subscribe(job.id, (j) => {
        send(j);
        if (j.status === "done" || j.status === "failed") {
          off();
          res.end();
        }
      });
      req.on("close", () => {
        off();
        res.end();
      });
    }),

    // Proje çıktıları (video, altyazı, rapor, kareler…).
    route("GET", "/api/projects/:id/files/:artifact", ({ req, res, params, url }) => {
      const p = load(params.id);
      const dir = path.join(dataDir, "projects", p.id);
      const map: Record<string, string | undefined> = {
        video: p.outputs.videoPath,
        subtitle: p.outputs.srtPath,
        poster: p.outputs.posterPath,
        audio: p.outputs.audioPath,
        verification: p.outputs.verificationPath,
        validation: p.outputs.validationPath,
        project: path.join(dir, "project.json"),
      };
      const file = map[params.artifact];
      if (!file) throw new HttpError(404, "Bilinmeyen çıktı.");
      sendFile(req, res, file, { download: url.searchParams.get("download") ?? undefined });
    }),

    route("GET", "/api/projects/:id/files/frames/:name", ({ req, res, params }) => {
      const p = load(params.id);
      const dir = p.outputs.framesDir ?? path.join(dataDir, "projects", p.id, "reports", "frames");
      sendFile(req, res, safeJoin(dir, params.name));
    }),

    // Sahne önizlemesi: gerçek render motorundan SVG kare (storyboard küçük resmi).
    route("GET", "/api/projects/:id/scenes/:sceneId/preview", ({ res, params, url }) => {
      const p = load(params.id);
      let timeline;
      try {
        timeline = timelineFor(p, { useAudio: Object.keys(p.narration.measured ?? {}).length > 0 });
      } catch {
        timeline = timelineFor(p, { useAudio: false });
      }
      const scene = timeline.scenes.find((s) => s.id === params.sceneId) ?? timeline.scenes[0];
      if (!scene) throw new HttpError(404, "Sahne bulunamadı.");
      const at = Number(url.searchParams.get("at") ?? 0.55);
      const t = Math.min(timeline.durationSec - 0.05, scene.startSec + scene.durationSec * Math.min(0.95, Math.max(0, at)));
      const svg = renderFrameSvg(timeline, t, { showSubtitles: url.searchParams.get("subs") !== "0" });
      res.writeHead(200, {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "no-cache",
      });
      res.end(svg);
    }),

    route("GET", "/api/projects/:id/scene-audio/:sceneId", ({ req, res, params }) => {
      const p = load(params.id);
      const file = p.narration.audioFiles?.[params.sceneId];
      if (!file) throw new HttpError(404, "Sahne sesi yok.");
      sendFile(req, res, file);
    }),

    // Görsel bileşen kataloğu (elle seçim için).
    route("GET", "/api/components", ({ res }) => {
      json(res, 200, {
        components: VISUAL_COMPONENTS.map((c) => ({
          id: c.id,
          labelTr: c.labelTr,
          domains: c.domains,
          mechanisms: c.mechanisms,
          concepts: c.concepts,
          scientificNote: c.scientificNote,
          incompatibleConcepts: c.incompatibleConcepts,
        })),
      });
    }),

    route("GET", "/api/system/tts", async ({ res }) => {
      json(res, 200, { status: await ttsStatus({ engine: defaultNarration.engine ?? "espeak", voice: defaultNarration.voice ?? "tr" }) });
    }),
  ];

  const handler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
    try {
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const m = r.pattern.exec(url.pathname);
        if (!m) continue;
        const params: Record<string, string> = {};
        r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
        const body = req.method === "GET" || req.method === "DELETE" ? undefined : await readJson(req);
        await r.handler({ req, res, url, params, body });
        return;
      }

      if (url.pathname.startsWith("/api/")) {
        json(res, 404, { error: "Bilinmeyen uç nokta", path: url.pathname });
        return;
      }

      // Statik arayüz (SPA).
      if (fs.existsSync(uiDir)) {
        const candidate = safeJoin(uiDir, url.pathname);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          sendFile(req, res, candidate);
          return;
        }
        const index = path.join(uiDir, "index.html");
        if (fs.existsSync(index)) {
          sendFile(req, res, index);
          return;
        }
      }
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(
        `<!doctype html><meta charset="utf-8"><title>Nedenmiş Studio</title>
        <body style="font-family:system-ui;background:#070b12;color:#e8f1f8;padding:40px">
        <h1>Nedenmiş Studio API çalışıyor</h1>
        <p>Arayüz derlemesi bulunamadı (<code>${uiDir}</code>). <code>npm run build</code> çalıştırın.</p>
        <p><a style="color:#56d6ff" href="/api/health">/api/health</a></p></body>`,
      );
    } catch (e) {
      const err = e as { status?: number; message?: string; report?: unknown; code?: string; hint?: string; detail?: string };
      const status = err.status ?? 500;
      if (status >= 500) console.error("[server]", e);
      json(res, status, {
        error: err.message ?? "Beklenmeyen hata",
        code: err.code,
        hint: err.hint,
        detail: err.detail,
        report: err.report,
      });
    }
  };

  const server = http.createServer((req, res) => {
    void handler(req, res);
  });

  return {
    server,
    store,
    jobs,
    dataDir,
    listen: (port = opts.port ?? 4319, host = opts.host ?? "127.0.0.1") =>
      new Promise<{ port: number }>((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
          const addr = server.address();
          resolve({ port: typeof addr === "object" && addr ? addr.port : port });
        });
      }),
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => {
          store.close();
          resolve();
        });
      }),
  };
}

function safe<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

// Doğrudan çalıştırma: node dist/index.js
const isMain = process.argv[1] && path.resolve(process.argv[1]).startsWith(path.resolve(path.dirname(new URL(import.meta.url).pathname)));
if (isMain) {
  const dataDir = process.env.NEDENMIS_DATA ?? path.join(process.env.APPDATA ?? process.env.HOME ?? process.cwd(), ".nedenmis-studio");
  const app = createStudioServer({
    dataDir,
    port: Number(process.env.PORT ?? 4319),
    host: process.env.HOST ?? "127.0.0.1",
    version: process.env.NEDENMIS_VERSION ?? "1.0.0",
  });
  app.listen().then(({ port }) => {
    console.log(`Nedenmiş Studio API: http://127.0.0.1:${port}  (veri: ${dataDir}, db: ${app.store.backend})`);
  });
  const shutdown = () => {
    void app.close().then(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

export { summarizeProject, planScenes, validatePlan, getCard };
