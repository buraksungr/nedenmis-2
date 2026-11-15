import { useCallback, useEffect, useMemo, useState } from "react";
import type { Project } from "@nedenmis/core";
import { api, ApiError, fileUrl, type Job } from "../api.ts";
import { navigate, useApp } from "../App.tsx";
import { Badge, CheckRow, ProgressBar, SceneChecks, VerificationList } from "../components/Checks.tsx";
import { SceneCard, type ComponentOption } from "../components/SceneCard.tsx";
import { formatDate, formatSec, useJob } from "../hooks.ts";

const STAGES = [
  { key: "research", label: "Araştırma" },
  { key: "scenes", label: "Sahne" },
  { key: "validate", label: "Doğrulama" },
  { key: "voice", label: "Ses" },
  { key: "render", label: "Render" },
  { key: "mux", label: "Birleştirme" },
  { key: "verify", label: "FFprobe" },
  { key: "done", label: "Hazır" },
];

export function Studio({ id }: { id: string }) {
  const { toast } = useApp();
  const [project, setProject] = useState<Project | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [components, setComponents] = useState<ComponentOption[]>([]);
  const [error, setError] = useState<{ message: string; hint?: string; detail?: string } | null>(null);
  const [tab, setTab] = useState<"verification" | "research">("verification");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { project: p, jobs } = await api.get(id);
      setProject(p);
      setSelected((cur) => cur ?? p.scenes[0]?.id ?? null);
      const active = jobs.find((j) => j.status === "queued" || j.status === "running");
      if (active) setJobId(active.id);
      setError(null);
    } catch (e) {
      const err = e as ApiError;
      setError({ message: err.message, hint: err.hint, detail: typeof err.detail === "string" ? err.detail : undefined });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    fetch("/api/components")
      .then((r) => r.json())
      .then((d: { components: ComponentOption[] }) => setComponents(d.components))
      .catch(() => setComponents([]));
  }, []);

  const job = useJob(jobId, (j: Job) => {
    void load();
    if (j.status === "failed") {
      toast(`İş başarısız: ${j.error?.message ?? "bilinmeyen hata"}`);
      setError({ message: j.error?.message ?? "İş başarısız", hint: j.error?.hint, detail: j.error?.detail });
    } else {
      toast(j.kind === "render" ? "Video hazır ve doğrulandı." : "Seslendirme tamamlandı.");
    }
  });

  const running = job && (job.status === "queued" || job.status === "running");
  const narrated = Object.keys(project?.narration.measured ?? {}).length > 0;
  const rejected = useMemo(() => project?.scenes.filter((s) => s.validation?.status !== "approved") ?? [], [project]);
  const selectedScene = project?.scenes.find((s) => s.id === selected) ?? null;

  async function startNarration() {
    if (!project) return;
    setBusy(true);
    setError(null);
    try {
      const { job: j } = await api.narrate(project.id);
      setJobId(j.id);
    } catch (e) {
      const err = e as ApiError;
      setError({ message: err.message, hint: err.hint, detail: typeof err.detail === "string" ? err.detail : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function startRender() {
    if (!project) return;
    setBusy(true);
    setError(null);
    try {
      const { job: j } = await api.render(project.id, project.exportSettings.quality);
      setJobId(j.id);
    } catch (e) {
      const err = e as ApiError;
      setError({ message: err.message, hint: err.hint, detail: typeof err.detail === "string" ? err.detail : undefined });
    } finally {
      setBusy(false);
    }
  }

  if (!project) {
    return (
      <div className="stack">
        {error ? (
          <div className="error-box">
            <div className="title">{error.message}</div>
            {error.hint && <div>{error.hint}</div>}
          </div>
        ) : (
          <div className="empty">Proje yükleniyor…</div>
        )}
        <button className="btn" onClick={() => navigate("/library")}>
          Kütüphaneye dön
        </button>
      </div>
    );
  }

  const statusTone = project.status === "ready" ? "ok" : project.status === "failed" ? "err" : "info";
  const stageIndex = STAGES.findIndex((s) => s.key === job?.stage);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head">
        <div>
          <div className="kicker">Stüdyo · {project.research?.cardId}</div>
          <h1>{project.title}</h1>
          <div className="row" style={{ gap: 8 }}>
            <Badge tone="neutral">“{project.topic}”</Badge>
            <Badge tone={statusTone as "ok" | "err" | "info"}>{project.status}</Badge>
            <Badge tone={project.validation?.status === "approved" ? "ok" : "err"}>
              görsel doğrulama: {project.validation?.status ?? "—"}
            </Badge>
            <Badge tone="neutral">hedef {project.targetDurationSec} sn</Badge>
            <Badge tone="neutral">
              dil: {project.languageLevel === "simple" ? "sade" : project.languageLevel === "standard" ? "standart" : "ayrıntılı"}
            </Badge>
            {project.timelineMeta && <Badge tone="info">gerçek {formatSec(project.timelineMeta.durationSec)}</Badge>}
            {project.narration.engineUsed && <Badge tone="neutral">{project.narration.engineUsed}</Badge>}
          </div>
        </div>
        <div className="row">
          <button className="btn ghost small" onClick={() => navigate("/library")}>
            Kütüphane
          </button>
          <button className="btn" onClick={() => void startNarration()} disabled={Boolean(running) || busy}>
            {narrated ? "Sesi yenile" : "Seslendir"}
          </button>
          <button className="btn primary" onClick={() => void startRender()} disabled={Boolean(running) || busy || !narrated}>
            {running && job?.kind === "render" ? "Render ediliyor…" : "Videoyu üret"}
          </button>
          {project.outputs.videoPath && (
            <a className="btn ghost" href={fileUrl(project.id, "video", `${project.title}-${project.targetDurationSec}s.mp4`)}>
              MP4 indir
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="error-box">
          <div className="title">{error.message}</div>
          {error.hint && <div>{error.hint}</div>}
          {error.detail && <div className="detail mono">{error.detail}</div>}
        </div>
      )}

      {rejected.length > 0 && (
        <div className="error-box">
          <div className="title">{rejected.length} sahne görsel doğrulamadan geçmedi</div>
          <div>
            Reddedilen sahneler render edilmez; bu yüzden video üretimi durdurulur. Sahneyi farklı bir görsel bileşenle yeniden
            üretin veya anlatımı düzeltin.
          </div>
        </div>
      )}

      {!narrated && (
        <div className="panel flat" style={{ padding: 14, borderStyle: "dashed" }}>
          <span className="small">
            Video üretmeden önce seslendirme gerekir: süre, altyazılar ve sahne zamanlaması <strong>ölçülen</strong> ses sürelerinden
            hesaplanır. “Seslendir” düğmesine basın.
          </span>
        </div>
      )}

      <div className="studio">
        <div className="stack">
          <div className="panel flat" style={{ padding: 14 }}>
            <div className="row" style={{ gap: 6, marginBottom: 10 }}>
              <span className="label" style={{ marginRight: 8 }}>
                Zaman çizelgesi
              </span>
              <span className="small">{project.scenes.length} sahne</span>
              <span className="spacer" />
              <span className="small">altyazı: {project.timelineMeta?.subtitleTiming === "word-aligned" ? "kelime hizalı" : "ifade tahmini"}</span>
            </div>
            <div className="timeline-strip">
              {project.scenes.map((s) => (
                <button
                  key={s.id}
                  className={`timeline-item ${s.validation?.status === "approved" ? "" : "rejected"}`}
                  style={{ flexGrow: Math.max(1, s.durationSec ?? 4) }}
                  onClick={() => setSelected(s.id)}
                  title={s.narration}
                >
                  <span>{String(s.index + 1).padStart(2, "0")}</span>
                  <span>{(s.durationSec ?? 0).toFixed(1)}s</span>
                </button>
              ))}
            </div>
          </div>

          <div className="scene-list">
            {project.scenes.map((scene) => (
              <SceneCard
                key={scene.id}
                projectId={project.id}
                scene={scene}
                selected={selected === scene.id}
                updatedAt={project.updatedAt}
                components={components}
                onSelect={() => setSelected(scene.id)}
                onSaveNarration={async (text) => {
                  try {
                    const { project: next } = await api.patch(project.id, { narrationEdits: { [scene.id]: text } });
                    setProject(next);
                    toast("Anlatım güncellendi — süre için sesi yeniden üretin.");
                  } catch (e) {
                    toast((e as Error).message);
                  }
                }}
                onRegenerate={async (componentId) => {
                  try {
                    const { project: next } = await api.regenerate(project.id, scene.id, componentId);
                    setProject(next);
                    toast("Sahne yeniden üretildi ve doğrulandı.");
                  } catch (e) {
                    const err = e as ApiError;
                    setError({ message: err.message, hint: err.hint, detail: typeof err.detail === "string" ? err.detail : undefined });
                  }
                }}
              />
            ))}
          </div>
        </div>

        <div className="stack" style={{ position: "sticky", top: 24 }}>
          {project.scriptQuality && (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Senaryo kalitesi</h2>
                  <span className="small">Sade dil · anlaşılırlık ölçümü</span>
                </div>
                <Badge tone={project.scriptQuality.ok ? "ok" : "warn"}>
                  {project.scriptQuality.score}/100
                </Badge>
              </div>
              <div className="meter" style={{ marginBottom: 14 }}>
                <div className="meter-bar" style={{ width: `${Math.max(4, project.scriptQuality.score)}%` }} />
              </div>
              <div className="stat-grid">
                <div className="stat">
                  <div className="stat-value">{project.scriptQuality.avgWordsPerSentence.toFixed(1)}</div>
                  <div className="stat-label">ort. kelime / cümle</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{project.scriptQuality.longestSentenceWords}</div>
                  <div className="stat-label">en uzun cümle</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{project.scriptQuality.technicalTermCount}</div>
                  <div className="stat-label">teknik terim</div>
                </div>
              </div>
              <div className="stack" style={{ gap: 6, marginTop: 14 }}>
                {project.scriptQuality.hook.ok ? (
                  <CheckRow ok title="Açılış merak uyandırıyor" detail={`“${project.scriptQuality.hook.sample}”`} />
                ) : (
                  <CheckRow ok={false} warn title="Açılış zayıf" detail="İlk iki cümlede soru veya şaşırtıcı bilgi yok." />
                )}
                {project.scriptQuality.issues.length === 0 && <CheckRow ok title="Cümle uzunluğu ve terim yoğunluğu sınır içinde" />}
                {project.scriptQuality.issues.map((i) => (
                  <CheckRow
                    key={i.code}
                    ok={i.severity !== "error"}
                    warn={i.severity !== "error"}
                    title={i.messageTr}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="panel">
            <h2>Çıktı</h2>
            {project.outputs.videoPath ? (
              <div className="stack">
                <div className="video-frame">
                  <video key={project.updatedAt} controls playsInline src={fileUrl(project.id, "video")} poster={project.outputs.posterPath ? fileUrl(project.id, "poster", undefined) : undefined} />
                </div>
                <div className="row">
                  <Badge tone={project.verification?.ok ? "ok" : "err"}>{project.verification?.ok ? "doğrulandı" : "doğrulama sorunlu"}</Badge>
                  {project.verification && <Badge tone="neutral">{project.verification.durationSec.toFixed(2)} sn</Badge>}
                  {project.verification && <Badge tone="neutral">{project.verification.video.width}×{project.verification.video.height}</Badge>}
                  {project.timelineMeta && <Badge tone="neutral">{project.timelineMeta.frames} kare</Badge>}
                </div>
                <div className="row">
                  <a className="btn small" href={fileUrl(project.id, "subtitle", "altyazi.srt")}>
                    .srt altyazı
                  </a>
                  <a className="btn small" href={fileUrl(project.id, "verification")} target="_blank" rel="noreferrer">
                    verification.json
                  </a>
                  <a className="btn small" href={fileUrl(project.id, "validation")} target="_blank" rel="noreferrer">
                    visual-validation.json
                  </a>
                </div>
              </div>
            ) : (
              <div className="video-frame">
                <div className="placeholder">
                  1080×1920 video burada görünecek.
                  <br />
                  Önce seslendirin, sonra “Videoyu üret”.
                </div>
              </div>
            )}
          </section>

          {(running || job) && (
            <section className="panel">
              <div className="row" style={{ marginBottom: 10 }}>
                <h2 style={{ margin: 0 }}>{job?.kind === "render" ? "Render" : "Seslendirme"}</h2>
                <span className="spacer" />
                <Badge tone={job?.status === "failed" ? "err" : job?.status === "done" ? "ok" : "info"}>{job?.status ?? "—"}</Badge>
              </div>
              <ProgressBar value={job?.progress ?? 0} />
              <div className="small" style={{ marginTop: 8 }}>
                {job?.message} {job?.events.length ? `· ${formatDate(job.events[job.events.length - 1].at)}` : ""}
              </div>
              <div className="steps" style={{ marginTop: 12 }}>
                {["research", "validate", "voice", "render", "mux", "verify", "done"].map((key) => {
                  const label = STAGES.find((s) => s.key === key)?.label ?? key;
                  const idx = STAGES.findIndex((s) => s.key === key);
                  const done = stageIndex > idx || job?.status === "done";
                  const active = stageIndex === idx && job?.status !== "done";
                  return (
                    <span key={key} className={`step-pill ${done ? "done" : active ? "active" : ""}`}>
                      {label}
                    </span>
                  );
                })}
              </div>
              {job?.error && <div className="error-box" style={{ marginTop: 12 }}><div className="title">{job.error.message}</div>{job.error.hint && <div className="detail">{job.error.hint}</div>}</div>}
            </section>
          )}

          <section className="panel">
            <div className="row" style={{ marginBottom: 12 }}>
              <button className={`chip ${tab === "verification" ? "active" : ""}`} onClick={() => setTab("verification")}>
                Doğrulama
              </button>
              <button className={`chip ${tab === "research" ? "active" : ""}`} onClick={() => setTab("research")}>
                Araştırma
              </button>
              <span className="spacer" />
              {selectedScene && <Badge tone="neutral">{selectedScene.spec.componentId}</Badge>}
            </div>

            {tab === "verification" &&
              (project.verification ? (
                <div className="stack">
                  <VerificationList report={project.verification} />
                  <div className="split-line" />
                  <h3>Seçili sahne</h3>
                  {selectedScene ? <SceneChecks scene={selectedScene} /> : <div className="small">Sahne seçin.</div>}
                </div>
              ) : (
                <div className="stack">
                  <div className="small">Video üretildiğinde FFprobe denetimleri burada listelenir.</div>
                  <div className="split-line" />
                  <h3>Seçili sahne doğrulaması</h3>
                  {selectedScene ? <SceneChecks scene={selectedScene} /> : <div className="small">Sahne seçin.</div>}
                  {selectedScene && (
                    <div className="small" style={{ marginTop: 6 }}>
                      Bilimsel not: {selectedScene.spec.scientificNote}
                    </div>
                  )}
                </div>
              ))}

            {tab === "research" && project.research && (
              <div className="stack">
                <div className="small">{project.research.summaryTr}</div>
                <div className="row" style={{ gap: 6 }}>
                  {project.research.domainLabels.map((d) => (
                    <Badge key={d} tone="neutral">
                      {d}
                    </Badge>
                  ))}
                  <Badge tone="info">güven {(project.research.confidence * 100).toFixed(0)}%</Badge>
                </div>
                <h3>Kanıtlar</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", fontSize: 13 }}>
                  {project.research.facts.slice(0, 6).map((f) => (
                    <li key={f.id} style={{ marginBottom: 6 }}>
                      {f.textTr}
                    </li>
                  ))}
                </ul>
                <h3>Kaynaklar</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", fontSize: 12.5 }}>
                  {project.research.sources.map((s) => (
                    <li key={s.id} style={{ marginBottom: 4 }}>
                      {s.publisher} — {s.title}
                    </li>
                  ))}
                </ul>
                <span className="small">Bilgi kaynağı: {project.research.mode === "curated-kb" ? "doğrulanmış bilgi kartları" : "bilgi kartı + dil modeli"}</span>
              </div>
            )}
          </section>

          <section className="panel flat">
            <div className="row">
              <div className="small">Kalite</div>
              <select
                className="select"
                style={{ width: 170 }}
                value={project.exportSettings.quality}
                onChange={async (e) => {
                  const q = e.target.value as "draft" | "standard" | "high";
                  const { project: next } = await api.patch(project.id, { quality: q });
                  setProject(next);
                }}
              >
                <option value="draft">Taslak · 540p</option>
                <option value="standard">Standart · 1080p</option>
                <option value="high">Yüksek · 1080p</option>
              </select>
              <span className="spacer" />
              <span className="small">{project.narration.engineUsed ?? project.narration.engine}</span>
            </div>
          </section>
        </div>
      </div>

      <section className="panel flat">
        <h2>Zamanlama</h2>
        <div className="kv">
          <dt>Hedef süre</dt>
          <dd>{project.targetDurationSec} sn</dd>
          <dt>Ölçülen anlatım</dt>
          <dd>{formatSec(Object.values(project.narration.measured ?? {}).reduce((a, b) => a + b, 0))}</dd>
          <dt>Video süresi</dt>
          <dd>{project.timelineMeta ? `${formatSec(project.timelineMeta.durationSec)} (${project.timelineMeta.withinTolerance ? "tolerans içinde" : "tolerans dışı"})` : "—"}</dd>
          <dt>Kare</dt>
          <dd>{project.timelineMeta ? `${project.timelineMeta.frames} @ ${project.timelineMeta.fps} fps` : "—"}</dd>
          <dt>Altyazı zamanlaması</dt>
          <dd>{project.timelineMeta?.subtitleTiming ?? "—"}</dd>
          <dt>Uyarılar</dt>
          <dd>{project.warnings.length ? project.warnings.join(" · ") : "yok"}</dd>
        </div>
        {project.verification && (
          <>
            <div className="split-line" />
            <h3>Kare örnekleri</h3>
            <div className="row">
              {project.verification.frameSamples.map((f) => (
                <a key={f.sceneId} href={fileUrl(project.id, `frames/${encodeURIComponent((f.imagePath ?? "").split(/[\\/]/).pop() ?? "")}`)} target="_blank" rel="noreferrer" className="small">
                  {f.sceneId} · {f.meanLuma.toFixed(0)} luma
                </a>
              ))}
            </div>
          </>
        )}
        <div className="split-line" />
        <div className="small">
          Son işlemler: {project.renderHistory.length ? project.renderHistory.slice(-3).map((h) => `${formatDate(h.at)} ${h.ok ? "✓" : "✗"}`).join(" · ") : "henüz render yok"}
        </div>
      </section>
    </div>
  );
}
