import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";

export type JobKind = "narration" | "render";
export type JobStatus = "queued" | "running" | "done" | "failed" | "cancelled";

export type JobEvent = {
  at: string;
  stage: string;
  progress: number;
  message: string;
  detail?: string;
};

export type Job = {
  id: string;
  projectId: string;
  kind: JobKind;
  status: JobStatus;
  progress: number;
  stage: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  error?: { code: string; message: string; hint?: string; detail?: string };
  result?: Record<string, unknown>;
  events: JobEvent[];
};

type JobRunner = (ctx: { job: Job; emit: (e: Partial<JobEvent>) => void }) => Promise<Record<string, unknown>>;

/**
 * Uzun süren işler (seslendirme, render) tek bir kuyrukta sırayla çalışır.
 * Hedef donanım 2 çekirdekli olduğu için paralel render kaynakları boşa harcar.
 */
export class JobManager {
  private jobs = new Map<string, Job>();
  private queue: { job: Job; run: JobRunner }[] = [];
  private active = false;
  private bus = new EventEmitter();

  constructor(private hooks: { onUpdate?: (job: Job) => void } = {}) {
    this.bus.setMaxListeners(50);
  }

  enqueue(projectId: string, kind: JobKind, run: JobRunner): Job {
    const now = new Date().toISOString();
    const job: Job = {
      id: randomUUID(),
      projectId,
      kind,
      status: "queued",
      progress: 0,
      stage: "queued",
      message: "Sıraya alındı",
      createdAt: now,
      updatedAt: now,
      events: [],
    };
    this.jobs.set(job.id, job);
    this.queue.push({ job, run });
    this.publish(job);
    void this.drain();
    return job;
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  list(projectId?: string): Job[] {
    return [...this.jobs.values()].filter((j) => !projectId || j.projectId === projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  findActive(projectId: string): Job | undefined {
    return [...this.jobs.values()].find((j) => j.projectId === projectId && (j.status === "queued" || j.status === "running"));
  }

  subscribe(id: string, fn: (job: Job) => void): () => void {
    const handler = (job: Job) => {
      if (job.id === id) fn(job);
    };
    this.bus.on("job", handler);
    return () => this.bus.off("job", handler);
  }

  private publish(job: Job) {
    this.hooks.onUpdate?.(job);
    this.bus.emit("job", { ...job, events: [...job.events] });
  }

  private async drain() {
    if (this.active) return;
    const next = this.queue.shift();
    if (!next) return;
    this.active = true;
    const { job, run } = next;
    const emit = (e: Partial<JobEvent>) => {
      const ev: JobEvent = {
        at: new Date().toISOString(),
        stage: e.stage ?? job.stage,
        progress: e.progress ?? job.progress,
        message: e.message ?? job.message,
        detail: e.detail,
      };
      job.stage = ev.stage;
      job.progress = ev.progress;
      job.message = ev.message;
      job.status = "running";
      job.updatedAt = ev.at;
      job.events.push(ev);
      if (job.events.length > 400) job.events.splice(0, job.events.length - 400);
      this.publish(job);
    };
    try {
      job.status = "running";
      emit({ stage: "starting", progress: 0.02, message: "Başlatılıyor…" });
      job.result = await run({ job, emit });
      job.status = "done";
      job.progress = 1;
      job.stage = "done";
      job.message = "Tamamlandı";
    } catch (e) {
      const err = e as { code?: string; message?: string; hint?: string; detail?: string };
      job.status = "failed";
      job.error = { code: err.code ?? "JOB_FAILED", message: err.message ?? String(e), hint: err.hint, detail: err.detail };
      job.message = err.message ?? String(e);
    } finally {
      job.updatedAt = new Date().toISOString();
      this.publish(job);
      this.active = false;
      void this.drain();
    }
  }
}
