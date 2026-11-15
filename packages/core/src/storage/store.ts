import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { ensureDir } from "../render/tools.js";
import type { Project, ProjectSummary } from "../project/types.js";
import { summarizeProject } from "../project/types.js";

type SqliteDb = {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    run: (...args: unknown[]) => { changes?: number };
    all: (...args: unknown[]) => unknown[];
    get: (...args: unknown[]) => unknown;
  };
  close: () => void;
};

/**
 * SQLite tabanlı proje deposu.
 *
 * Node 22'nin yerleşik `node:sqlite` modülü kullanılır (harici derleme yok,
 * Windows kurulumunda ek bağımlılık gerektirmez). Modül mevcut değilse aynı
 * arayüzle JSON dosya deposuna düşer ve bunu `backend` alanında bildirir.
 */
export class ProjectStore {
  readonly backend: "sqlite" | "json";
  private db?: SqliteDb;
  private jsonPath: string;
  private cache: Map<string, Project> = new Map();

  constructor(private dir: string) {
    ensureDir(dir);
    this.jsonPath = path.join(dir, "projects.json");
    try {
      const require = createRequire(import.meta.url);
      const { DatabaseSync } = require("node:sqlite") as { DatabaseSync: new (p: string) => SqliteDb };
      this.db = new DatabaseSync(path.join(dir, "nedenmis.db"));
      this.db.exec(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          topic TEXT NOT NULL,
          title TEXT NOT NULL,
          status TEXT NOT NULL,
          card_id TEXT,
          duration REAL DEFAULT 0,
          engine TEXT,
          data TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS assets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id TEXT NOT NULL,
          kind TEXT NOT NULL,
          path TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);
        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id TEXT,
          at TEXT NOT NULL,
          level TEXT NOT NULL,
          message TEXT NOT NULL
        );
      `);
      this.backend = "sqlite";
    } catch {
      this.backend = "json";
      if (fs.existsSync(this.jsonPath)) {
        try {
          const raw = JSON.parse(fs.readFileSync(this.jsonPath, "utf8")) as Project[];
          for (const p of raw) this.cache.set(p.id, p);
        } catch {
          /* bozuk dosya: boş başla */
        }
      }
    }
  }

  private persistJson() {
    if (this.backend !== "json") return;
    fs.writeFileSync(this.jsonPath, JSON.stringify([...this.cache.values()], null, 2), "utf8");
  }

  upsert(project: Project): Project {
    const updated = { ...project, updatedAt: new Date().toISOString() };
    if (this.db) {
      this.db
        .prepare(
          `INSERT INTO projects (id, topic, title, status, card_id, duration, engine, data, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET topic=excluded.topic, title=excluded.title, status=excluded.status,
             card_id=excluded.card_id, duration=excluded.duration, engine=excluded.engine,
             data=excluded.data, updated_at=excluded.updated_at`,
        )
        .run(
          updated.id,
          updated.topic,
          updated.title,
          updated.status,
          updated.research?.cardId ?? null,
          updated.timelineMeta?.durationSec ?? 0,
          updated.narration.engineUsed ?? updated.narration.engine,
          JSON.stringify(updated),
          updated.createdAt,
          updated.updatedAt,
        );
      if (updated.outputs.videoPath) {
        this.db
          .prepare(`INSERT INTO assets (project_id, kind, path, created_at) SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM assets WHERE project_id=? AND path=?)`)
          .run(updated.id, "video", updated.outputs.videoPath, new Date().toISOString(), updated.id, updated.outputs.videoPath);
      }
    } else {
      this.cache.set(updated.id, updated);
      this.persistJson();
    }
    return updated;
  }

  get(id: string): Project | null {
    if (this.db) {
      const row = this.db.prepare(`SELECT data FROM projects WHERE id = ?`).get(id) as { data: string } | undefined;
      if (!row) return null;
      try {
        return JSON.parse(row.data) as Project;
      } catch {
        return null;
      }
    }
    return this.cache.get(id) ?? null;
  }

  list(): ProjectSummary[] {
    if (this.db) {
      const rows = this.db.prepare(`SELECT data FROM projects ORDER BY created_at DESC`).all() as { data: string }[];
      return rows
        .map((r) => {
          try {
            return summarizeProject(JSON.parse(r.data) as Project);
          } catch {
            return null;
          }
        })
        .filter((x): x is ProjectSummary => Boolean(x));
    }
    return [...this.cache.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(summarizeProject);
  }

  delete(id: string): boolean {
    if (this.db) {
      const before = this.get(id);
      this.db.prepare(`DELETE FROM projects WHERE id = ?`).run(id);
      this.db.prepare(`DELETE FROM assets WHERE project_id = ?`).run(id);
      return Boolean(before);
    }
    const existed = this.cache.delete(id);
    this.persistJson();
    return existed;
  }

  log(projectId: string | null, level: "info" | "error", message: string) {
    if (this.db) {
      this.db.prepare(`INSERT INTO events (project_id, at, level, message) VALUES (?,?,?,?)`).run(projectId, new Date().toISOString(), level, message);
    } else {
      ensureDir(this.dir);
      fs.appendFileSync(path.join(this.dir, "events.log"), `[${new Date().toISOString()}] ${level} ${projectId ?? "-"} ${message}\n`);
    }
  }

  getSetting(key: string): string | null {
    if (this.db) {
      const row = this.db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as { value: string } | undefined;
      return row?.value ?? null;
    }
    const p = path.join(this.dir, "settings.json");
    if (!fs.existsSync(p)) return null;
    const obj = JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, string>;
    return obj[key] ?? null;
  }

  setSetting(key: string, value: string): void {
    if (this.db) {
      this.db.prepare(`INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, value);
      return;
    }
    const p = path.join(this.dir, "settings.json");
    const obj = fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, string>) : {};
    obj[key] = value;
    fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
  }

  close() {
    this.db?.close();
  }
}
const require = createRequire(import.meta.url);
