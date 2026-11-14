import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, type Health } from "./api.ts";
import { Create } from "./screens/Create.tsx";
import { Studio } from "./screens/Studio.tsx";
import { Library } from "./screens/Library.tsx";
import { Settings } from "./screens/Settings.tsx";

export type Route = { name: "new" } | { name: "studio"; id: string } | { name: "library" } | { name: "settings" };

export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "");
  const [head, id] = clean.split("/");
  if (head === "studio" && id) return { name: "studio", id };
  if (head === "library") return { name: "library" };
  if (head === "settings") return { name: "settings" };
  return { name: "new" };
}

export function navigate(path: string) {
  window.location.hash = path.startsWith("#") ? path : `#${path}`;
}

type AppState = {
  health: Health | null;
  refreshHealth: () => void;
  toast: (message: string) => void;
};

const Ctx = createContext<AppState>({ health: null, refreshHealth: () => {}, toast: () => {} });
export const useApp = () => useContext(Ctx);

export function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  const [health, setHealth] = useState<Health | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const refreshHealth = useCallback(() => {
    api
      .health()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  const toast = useCallback((message: string) => {
    setToastMsg(message);
    window.setTimeout(() => setToastMsg((cur) => (cur === message ? null : cur)), 4200);
  }, []);

  const value = useMemo<AppState>(() => ({ health, refreshHealth, toast }), [health, refreshHealth, toast]);

  const engineOk = health?.tts?.find((t) => t.engine === "espeak")?.available ?? false;

  return (
    <Ctx.Provider value={value}>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">N</div>
            <div className="brand-text">
              <div className="brand-title">Nedenmiş</div>
              <div className="brand-sub">Studio v{health?.version ?? "1.0.0"}</div>
            </div>
          </div>

          <nav className="nav">
            <button className={`nav-item ${route.name === "new" ? "active" : ""}`} onClick={() => navigate("/new")}>
              <span className="nav-icon">✦</span>
              <span className="nav-label">Yeni video</span>
            </button>
            <button className={`nav-item ${route.name === "library" ? "active" : ""}`} onClick={() => navigate("/library")}>
              <span className="nav-icon">▤</span>
              <span className="nav-label">Kütüphane</span>
            </button>
            <button className={`nav-item ${route.name === "settings" ? "active" : ""}`} onClick={() => navigate("/settings")}>
              <span className="nav-icon">⚙</span>
              <span className="nav-label">Ayarlar</span>
            </button>
          </nav>

          <div className="sidebar-foot">
            <div className="status-line">
              <span className={`dot ${health ? (engineOk ? "ok" : "warn") : "err"}`} />
              {health ? (engineOk ? "Yerel ses motoru hazır" : "Ses motoru eksik") : "Motora bağlanılamadı"}
            </div>
            <div className="status-line">
              <span className={`dot ${health?.ffmpeg ? "ok" : "err"}`} />
              {health?.ffmpeg ? "FFmpeg hazır" : "FFmpeg bulunamadı"}
            </div>
            <div className="status-line">
              <span className={`dot ${health?.db === "sqlite" ? "ok" : "warn"}`} />
              {health?.db === "sqlite" ? "SQLite proje deposu" : "JSON proje deposu"}
            </div>
          </div>
        </aside>

        <main className="main">
          {route.name === "new" && <Create />}
          {route.name === "studio" && <Studio key={route.id} id={route.id} />}
          {route.name === "library" && <Library />}
          {route.name === "settings" && <Settings />}
        </main>
      </div>
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </Ctx.Provider>
  );
}
