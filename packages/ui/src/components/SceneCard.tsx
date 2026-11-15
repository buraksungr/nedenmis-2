import { useEffect, useState } from "react";
import type { Scene } from "@nedenmis/core";
import { scenePreviewUrl } from "../api.ts";
import { Badge } from "./Checks.tsx";

export type ComponentOption = { id: string; labelTr: string; domains: string[]; mechanisms: string[] };

type Props = {
  projectId: string;
  scene: Scene;
  selected: boolean;
  updatedAt: string;
  components: ComponentOption[];
  onSelect: () => void;
  onSaveNarration: (text: string) => Promise<void>;
  onRegenerate: (componentId?: string) => Promise<void>;
};

export function SceneCard({ projectId, scene, selected, updatedAt, components, onSelect, onSaveNarration, onRegenerate }: Props) {
  const [text, setText] = useState(scene.narration);
  const [busy, setBusy] = useState<"save" | "regen" | null>(null);
  const [component, setComponent] = useState(scene.spec.componentId);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    setText(scene.narration);
    setComponent(scene.spec.componentId);
  }, [scene.narration, scene.spec.componentId]);

  const approved = scene.validation?.status === "approved";

  return (
    <article className={`scene-card ${selected ? "selected" : ""}`} onClick={onSelect}>
      <div className="scene-thumb">
        <img src={`${scenePreviewUrl(projectId, scene.id, 0.55, `${updatedAt}-${previewKey}`)}`} alt={scene.overlay} loading="lazy" />
        <span className="scene-index">{String(scene.index + 1).padStart(2, "0")}</span>
      </div>

      <div className="scene-body">
        <div className="row" style={{ gap: 8 }}>
          <span className="scene-title">{scene.overlay}</span>
          <span className="spacer" />
          <Badge tone={approved ? "ok" : "err"}>{approved ? "onaylı" : "reddedildi"}</Badge>
        </div>

        <div className="scene-meta">
          <Badge tone="neutral">{scene.spec.componentId}</Badge>
          <Badge tone="neutral">{scene.spec.mechanism}</Badge>
          {scene.durationSec ? <Badge tone="info">{scene.durationSec.toFixed(1)} sn</Badge> : null}
          {scene.validation?.status === "approved" && scene.validation.checks.some((c) => !c.ok && c.severity === "warning") ? (
            <Badge tone="warn">uyarı</Badge>
          ) : null}
        </div>

        <p className="scene-narr" style={selected ? { WebkitLineClamp: 6, display: "block" } : undefined}>
          {scene.narration}
        </p>

        {selected && (
          <div className="scene-expanded" onClick={(e) => e.stopPropagation()}>
            <div className="field">
              <span className="label">Anlatım metni</span>
              <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} />
              <span className="small">
                {text.trim().split(/\s+/).filter(Boolean).length} kelime · tahmini {((text.trim().split(/\s+/).filter(Boolean).length || 0) / 2.35).toFixed(1)} sn
              </span>
            </div>

            <div className="field">
              <span className="label">Görsel bileşen</span>
              <select className="select" value={component} onChange={(e) => setComponent(e.target.value)}>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.labelTr} · {c.id}
                  </option>
                ))}
                {!components.some((c) => c.id === scene.spec.componentId) && <option value={scene.spec.componentId}>{scene.spec.componentId}</option>}
              </select>
              <span className="small">{scene.spec.rationale}</span>
            </div>

            <div className="row">
              <button
                className="btn small"
                disabled={busy !== null || text === scene.narration}
                onClick={async () => {
                  setBusy("save");
                  try {
                    await onSaveNarration(text);
                    setPreviewKey((k) => k + 1);
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                {busy === "save" ? "Kaydediliyor…" : "Anlatımı kaydet"}
              </button>
              <button
                className="btn small"
                disabled={busy !== null}
                onClick={async () => {
                  setBusy("regen");
                  try {
                    await onRegenerate(component === scene.spec.componentId ? undefined : component);
                    setPreviewKey((k) => k + 1);
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                {busy === "regen" ? "Üretiliyor…" : "Sahneyi yeniden üret"}
              </button>
              {scene.speechDurationSec ? (
                <a className="btn ghost small" href={`/api/projects/${projectId}/scene-audio/${scene.id}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  Sesi dinle
                </a>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
