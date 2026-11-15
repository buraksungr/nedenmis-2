/**
 * Geliştirme/demo: üretilmiş örnek projeleri SQLite deposuna aktarır.
 *   node --import tsx scripts/seed-demo.ts
 *
 * Yalnızca gerçekten üretilmiş (video dosyası var olan) projeler alınır;
 * var olmayan çıktılar atlanır. Var olan kayıtların üzerine yazılır.
 */
import fs from "node:fs";
import path from "node:path";
import { ProjectStore } from "../packages/core/src/storage/store.ts";
import { resolveDataDir } from "../packages/core/src/render/tools.ts";
import type { Project } from "../packages/core/src/project/types.ts";

const dataDir = resolveDataDir();
const store = new ProjectStore(path.join(dataDir, "db"));
const work = path.join(dataDir, "samples-work", "projects");
if (!fs.existsSync(work)) {
  console.error("samples-work bulunamadı:", work);
  process.exit(1);
}

let imported = 0;
let skipped = 0;
const seen = new Set<string>();

for (const dir of fs.readdirSync(work)) {
  const file = path.join(work, dir, "project.json");
  if (!fs.existsSync(file)) continue;
  let project: Project;
  try {
    project = JSON.parse(fs.readFileSync(file, "utf8")) as Project;
  } catch {
    skipped++;
    continue;
  }
  const video = project.outputs?.videoPath;
  if (!video || !fs.existsSync(video)) {
    skipped++;
    continue;
  }
  if (seen.has(project.research?.cardId ?? project.id)) {
    skipped++;
    continue;
  }
  seen.add(project.research?.cardId ?? project.id);
  const saved = store.upsert({ ...project, notes: [...new Set([...(project.notes ?? []), "Demo kitaplığına aktarıldı (scripts/seed-demo.ts)."])] });
  console.log(`  + ${saved.title} — ${saved.timelineMeta?.durationSec?.toFixed(1) ?? "?"} sn (${path.basename(video)})`);
  imported++;
}

console.log(`\nAktarılan: ${imported}, atlanan: ${skipped}, depo: ${store.backend}, toplam kayıt: ${store.list().length}`);
store.close();
