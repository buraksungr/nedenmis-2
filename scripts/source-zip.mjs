// Kaynak arşivi: release/NedenmisStudio-Source.zip
//
// Depodaki izlenen dosyaların tamamı (samples/, docs/, .github/ dahil) tek bir
// zip'te toplanır. `git archive` kullanılıyor: Windows/Linux'ta aynı sonucu verir,
// yok sayılan dosyaları (node_modules, dist, vendor, data) kendiliğinden dışlar ve
// PowerShell Compress-Archive'ın yol/uzunluk sınırlarına takılmaz.
//
//   node scripts/source-zip.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const releaseDir = path.join(root, "release");
fs.mkdirSync(releaseDir, { recursive: true });
const out = path.join(releaseDir, "NedenmisStudio-Source.zip");
fs.rmSync(out, { force: true });

const version = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
const prefix = `NedenmisStudio-${version}/`;

const git = spawnSync("git", ["archive", "--format=zip", `--prefix=${prefix}`, "-o", out, "HEAD"], {
  cwd: root,
  encoding: "utf8",
});

if (git.status !== 0 || !fs.existsSync(out)) {
  console.error("git archive başarısız:", (git.stderr || git.error?.message || "").trim().slice(0, 800));
  console.error("İpucu: bu betik deponun içinde (git) çalışmalıdır.");
  process.exit(git.status ?? 1);
}

const bytes = fs.statSync(out).size;
const sha = crypto.createHash("sha256").update(fs.readFileSync(out)).digest("hex");
console.log(`Kaynak arşivi: ${path.relative(root, out)} — ${(bytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`  sha256: ${sha}`);
console.log(`  kök klasör: ${prefix} (${gitStdoutCount()} dosya)`);

function gitStdoutCount() {
  const ls = spawnSync("git", ["ls-files"], { cwd: root, encoding: "utf8" });
  return (ls.stdout || "").trim().split("\n").filter(Boolean).length;
}
