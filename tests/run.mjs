// Test koşucusu: TS test dosyalarını platformdan bağımsız olarak toplar.
//   node tests/run.mjs            → birim testleri
//   node tests/run.mjs --e2e      → uçtan uca testler (gerçek video üretir)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const e2e = process.argv.includes("--e2e");
const dir = path.join(process.cwd(), "tests", e2e ? "e2e" : "unit");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".test.ts"))
  .map((f) => path.join(dir, f));

if (!files.length) {
  console.error("Test dosyası bulunamadı:", dir);
  process.exit(1);
}

const res = spawnSync(process.execPath, ["--import", "tsx", "--test", ...files], {
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS ?? "" },
});
process.exit(res.status ?? 1);
