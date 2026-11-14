// Kaynak arşivi: release/NedenmisStudio-Source.zip
// node_modules, .git, data, dist, release, vendor, .venv ve büyük mp4'ler hariç.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const releaseDir = path.join(root, "release");
fs.mkdirSync(releaseDir, { recursive: true });
const out = path.join(releaseDir, "NedenmisStudio-Source.zip");
fs.rmSync(out, { force: true });

const excludes = [
  ".git",
  "node_modules",
  "dist",
  "dist-app",
  "release",
  "vendor",
  ".venv",
  "data",
  "reports",
  "samples",
  "packages/*/dist",
  "packages/ui/dist",
  "package-lock.json",
];

if (process.platform === "win32") {
  // PowerShell Compress-Archive ile (Windows CI).
  const staging = path.join(root, ".source-staging");
  fs.rmSync(staging, { recursive: true, force: true });
  copyTree(root, staging);
  const res = spawnSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${staging}\\*' -DestinationPath '${out}' -CompressionLevel Optimal`], { stdio: "inherit" });
  fs.rmSync(staging, { recursive: true, force: true });
  if (res.status !== 0) process.exit(res.status ?? 1);
} else {
  const res = spawnSync("zip", ["-r", "-q", out, ".", ...excludes.flatMap((e) => ["-x", `${e}/*`, "-x", e])], { cwd: root, stdio: "inherit" });
  if (res.status !== 0) {
    // zip yoksa tar.gz üret.
    console.warn("zip bulunamadı, tar.gz üretiliyor…");
    const tarOut = path.join(releaseDir, "NedenmisStudio-Source.tar.gz");
    spawnSync("tar", ["-czf", tarOut, "--exclude=.git", "--exclude=node_modules", "--exclude=dist", "--exclude=data", "--exclude=release", "--exclude=vendor", "--exclude=.venv", "."], { cwd: root, stdio: "inherit" });
    console.log("Kaynak arşivi:", tarOut);
    process.exit(0);
  }
}

console.log("Kaynak arşivi:", out, `${(fs.statSync(out).size / 1024 / 1024).toFixed(1)} MB`);

function copyTree(from, to, depth = 0) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const rel = path.relative(root, path.join(from, entry.name)).replace(/\\/g, "/");
    if (excludes.some((e) => rel === e || rel.startsWith(`${e}/`) || (e.includes("*") && rel.startsWith(e.replace("/*", ""))))) continue;
    if (entry.name.endsWith(".mp4")) continue;
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(src, dst, depth + 1);
    else fs.copyFileSync(src, dst);
  }
}
