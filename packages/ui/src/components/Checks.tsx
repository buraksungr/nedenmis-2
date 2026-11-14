import type { Scene, VerificationReport } from "@nedenmis/core";

export function Badge({ tone, children }: { tone: "ok" | "warn" | "err" | "info" | "neutral"; children: React.ReactNode }) {
  const cls = tone === "neutral" ? "badge" : `badge ${tone}`;
  return <span className={cls}>{children}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="progress">
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function CheckRow({ ok, warn, title, detail }: { ok: boolean; warn?: boolean; title: string; detail?: string }) {
  const cls = ok ? (warn ? "warn" : "ok") : "err";
  return (
    <div className="check-row">
      <span className={`check-icon ${cls}`}>{ok ? (warn ? "!" : "✓") : "×"}</span>
      <div>
        <div>{title}</div>
        {detail && <div className="check-detail">{detail}</div>}
      </div>
    </div>
  );
}

const CHECK_LABELS: Record<string, string> = {
  frames_exact: "Kare sayısı tam",
  duration_tolerance: "Süre toleransı (±%5)",
  resolution_1080x1920: "Çözünürlük 1080×1920",
  codec_h264: "Video kodeği H.264",
  audio_aac_48k: "Ses AAC 48 kHz",
  audio_video_sync: "Ses-görüntü senkronu (<120 ms)",
  scene_visual_presence: "Sahneler boş değil",
  fps_30: "30 fps",
};

export function VerificationList({ report }: { report: VerificationReport }) {
  return (
    <div className="stack" style={{ gap: 4 }}>
      {report.checks.map((c) => (
        <CheckRow
          key={c.id}
          ok={c.ok}
          warn={c.severity === "warning"}
          title={CHECK_LABELS[c.id] ?? c.id}
          detail={c.ok ? c.detail : `${c.detail}${c.severity === "error" ? " — düzeltilmeli" : ""}`}
        />
      ))}
    </div>
  );
}

export function SceneChecks({ scene }: { scene: Scene }) {
  const checks = scene.validation?.checks ?? [];
  const errors = checks.filter((c) => !c.ok && c.severity === "error");
  const warnings = checks.filter((c) => !c.ok && c.severity === "warning");
  return (
    <div className="stack" style={{ gap: 4 }}>
      {scene.validation?.status === "approved" ? (
        <CheckRow ok title="Görsel doğrulandı" detail={warnings.length ? `${warnings.length} uyarı: ${warnings.map((w) => w.message).slice(0, 2).join(" · ")}` : `Skor ${scene.validation.score.toFixed(2)}`} />
      ) : (
        <CheckRow ok={false} title="Sahne reddedildi" detail={errors.map((e) => e.message).join(" · ")} />
      )}
      {checks
        .filter((c) => c.ok && c.severity === "info")
        .slice(0, 3)
        .map((c) => (
          <CheckRow key={c.code} ok title={c.message} />
        ))}
    </div>
  );
}
