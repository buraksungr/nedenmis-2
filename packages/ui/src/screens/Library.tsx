import { useEffect, useState } from "react";
import type { ProjectSummary } from "@nedenmis/core";
import { api, fileUrl } from "../api.ts";
import { navigate, useApp } from "../App.tsx";
import { Badge } from "../components/Checks.tsx";
import { formatDate, formatSec } from "../hooks.ts";

export function Library() {
  const { toast } = useApp();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [db, setDb] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.list();
      setProjects(res.projects);
      setDb(res.db);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head">
        <div>
          <div className="kicker">Kütüphane · {db === "sqlite" ? "SQLite" : "JSON"} depo</div>
          <h1>Projeler</h1>
          <p className="sub">Her proje; araştırma özeti, senaryo, sahne planı, doğrulama raporları ve üretilen videoyu birlikte saklar.</p>
        </div>
        <button className="btn primary" onClick={() => navigate("/new")}>
          Yeni video
        </button>
      </div>

      {loading ? (
        <div className="empty">Yükleniyor…</div>
      ) : projects.length === 0 ? (
        <div className="empty">
          Henüz proje yok. “Yeni video” ile ilk konunuzu planlayın.
          <div style={{ marginTop: 16 }}>
            <button className="btn" onClick={() => navigate("/new")}>
              Konu yaz
            </button>
          </div>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((p) => (
            <article key={p.id} className="project-card" onClick={() => navigate(`/studio/${p.id}`)}>
              <div className="project-poster">
                {p.videoPath ? <img src={fileUrl(p.id, "poster")} alt={p.title} loading="lazy" /> : <div className="fallback">taslak</div>}
              </div>
              <div className="project-info">
                <div className="project-title">{p.title}</div>
                <div className="project-sub">“{p.topic}”</div>
                <div className="row" style={{ gap: 6 }}>
                  <Badge tone={p.status === "ready" ? "ok" : p.status === "failed" ? "err" : "info"}>{p.status}</Badge>
                  {p.validation && <Badge tone={p.validation === "approved" ? "ok" : "err"}>{p.validation}</Badge>}
                  <Badge tone="neutral">{formatSec(p.durationSec || p.targetDurationSec)}</Badge>
                </div>
                <div className="row">
                  <span className="small">{formatDate(p.updatedAt)}</span>
                  <span className="spacer" />
                  <button
                    className="btn ghost small danger"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm("Bu proje ve çıktıları silinsin mi?")) return;
                      await api.remove(p.id);
                      toast("Proje silindi.");
                      void load();
                    }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
