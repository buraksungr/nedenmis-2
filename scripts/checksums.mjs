// Yayın dosyalarının SHA-256 listesini üretir: release/SHA256SUMS.txt
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = [];
const releaseDir = path.join(root, "release");
const patterns = [/^NedenmisStudio-Setup\.exe$/, /^NedenmisStudio-Portable\.zip$/, /^NedenmisStudio-Source\.zip$/];

if (fs.existsSync(releaseDir)) {
  for (const f of fs.readdirSync(releaseDir)) if (patterns.some((p) => p.test(f))) targets.push(path.join(releaseDir, f));
}
const samplesDir = path.join(root, "samples");
if (fs.existsSync(samplesDir)) {
  for (const d of fs.readdirSync(samplesDir)) {
    const dir = path.join(samplesDir, d);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) if (f.endsWith(".mp4") || f.endsWith(".srt") || f.endsWith(".png")) targets.push(path.join(dir, f));
  }
}

if (!targets.length) {
  console.error("Hiç yayın dosyası bulunamadı (release/ ve samples/ boş).");
  process.exit(1);
}

const lines = [];
for (const file of targets.sort()) {
  const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const size = fs.statSync(file).size;
  lines.push(`${hash}  ${rel}  (${(size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`${hash.slice(0, 16)}…  ${rel}`);
}

const out = path.join(releaseDir, "SHA256SUMS.txt");
fs.mkdirSync(releaseDir, { recursive: true });
fs.writeFileSync(out, `# Nedenmiş Studio — SHA-256\n# ${new Date().toISOString()}\n\n` + lines.join("\n") + "\n", "utf8");
console.log(`\n${lines.length} dosya → ${path.relative(root, out)}`);
