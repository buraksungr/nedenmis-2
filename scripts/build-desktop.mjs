/**
 * Masaüstü uygulamasını paketler.
 *
 *   node scripts/build-desktop.mjs            # Windows kurulum dosyası (CI'da)
 *   node scripts/build-desktop.mjs --prepare  # yalnızca dist-app + vendor hazırlığı
 *
 * Adımlar:
 *  1. core/server/ui derlemelerinin varlığını doğrular
 *  2. sunucuyu tek ESM dosyasına paketler (yerel modüller dışta)
 *  3. dist-app/ ve vendor/ ağacını hazırlar
 *  4. electron-builder ile NSIS kurulum dosyası üretir
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const root = process.cwd();
const appDir = path.join(root, "dist-app");
const vendorDir = path.join(root, "vendor");
const prepareOnly = process.argv.includes("--prepare");
const require = createRequire(import.meta.url);

function say(msg) {
  console.log(`[desktop] ${msg}`);
}

function must(p, what) {
  if (!fs.existsSync(p)) {
    console.error(`[desktop] Eksik: ${what} (${p})`);
    console.error("[desktop] Önce: npm run build");
    process.exit(1);
  }
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

must(path.join(root, "packages/core/dist/index.js"), "core derlemesi");
must(path.join(root, "packages/ui/dist/index.html"), "arayüz derlemesi");

fs.rmSync(appDir, { recursive: true, force: true });
fs.mkdirSync(appDir, { recursive: true });

// 1) Sunucuyu tek dosyaya paketle.
say("sunucu paketleniyor (esbuild)…");
const esbuild = await import("esbuild");
await esbuild.build({
  entryPoints: [path.join(root, "packages/server/src/index.ts")],
  outfile: path.join(appDir, "server.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  sourcemap: false,
  minify: false,
  logLevel: "warning",
  external: ["@resvg/resvg-js", "@ffmpeg-installer/ffmpeg", "@ffprobe-installer/ffprobe", "electron"],
  banner: { js: "// Nedenmiş Studio — paketlenmiş sunucu (esbuild)" },
});

// 2) Electron ana süreç dosyaları + arayüz.
copyDir(path.join(root, "packages/desktop"), appDir);
for (const f of ["main.cjs", "preload.cjs"]) must(path.join(appDir, f), f);
fs.rmSync(path.join(appDir, "electron-builder.yml"), { force: true });
fs.rmSync(path.join(appDir, "node_modules"), { recursive: true, force: true });
copyDir(path.join(root, "packages/ui/dist"), path.join(appDir, "ui"));
fs.writeFileSync(
  path.join(appDir, "package.json"),
  JSON.stringify(
    {
      name: "nedenmis-studio",
      productName: "Nedenmiş Studio",
      version: JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version,
      main: "main.cjs",
      description: "Nedenmiş Studio masaüstü uygulaması — bilimsel doğruluk odaklı Türkçe kısa bilim videosu üretimi",
      // NSIS yayıncı adı ve "Programlar ve Özellikler" girdisi için gerekli.
      author: { name: "Nedenmiş Studio", email: "buraksungr@users.noreply.github.com" },
      license: "MIT",
      homepage: "https://github.com/buraksungr/nedenmis-2",
      repository: { type: "git", url: "https://github.com/buraksungr/nedenmis-2.git" },
    },
    null,
    2,
  ),
  "utf8",
);

// 2b) Sunucunun çalışma zamanı bağımlılıklarını dist-app/node_modules içine kopyala.
say("çalışma zamanı modülleri kopyalanıyor…");
const runtimeModules = ["@resvg", "@ffmpeg-installer", "@ffprobe-installer"];
for (const name of runtimeModules) {
  const from = path.join(root, "node_modules", name);
  if (!fs.existsSync(from)) {
    console.warn(`[desktop] UYARI: ${name} bulunamadı (npm ci sonrası tekrar deneyin).`);
    continue;
  }
  copyDir(from, path.join(appDir, "node_modules", name));
}

// 3) FFmpeg/FFprobe ikilileri.
say("FFmpeg ve FFprobe kopyalanıyor…");
fs.mkdirSync(path.join(vendorDir, "bin"), { recursive: true });
for (const [pkg, name] of [
  ["@ffmpeg-installer/ffmpeg", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"],
  ["@ffprobe-installer/ffprobe", process.platform === "win32" ? "ffprobe.exe" : "ffprobe"],
]) {
  try {
    let p;
    try {
      p = require(`@${pkg.split("/")[1]}/${process.platform}-${process.arch}`).path;
    } catch {
      p = require(pkg).path;
    }
    const dest = path.join(vendorDir, "bin", name);
    fs.copyFileSync(p, dest);
    if (process.platform !== "win32") fs.chmodSync(dest, 0o755);
    say(`  ${name} → ${path.relative(root, dest)}`);
  } catch (e) {
    console.warn(`[desktop] UYARI: ${pkg} bulunamadı (${e.message}). Uygulama sistemdeki ffmpeg'i arayacak.`);
  }
}

// 4) Gömülü Python (CI'da hazırlanır) doğrulaması.
const pyWin = path.join(vendorDir, "python", "python.exe");
const pyNix = path.join(vendorDir, "python", "bin", "python3");
if (fs.existsSync(pyWin) || fs.existsSync(pyNix)) {
  say(`gömülü Python: ${fs.existsSync(pyWin) ? "vendor/python/python.exe" : "vendor/python/bin/python3"}`);
} else {
  console.warn("[desktop] UYARI: vendor/python yok. eSpeak seslendirme sistem Python'unu arayacak.");
}

// 5) Lisans dosyası (About → lisanslar).
const licensePath = path.join(root, "LICENSE");
if (fs.existsSync(licensePath) && !fs.existsSync(path.join(appDir, "LICENSE"))) fs.copyFileSync(licensePath, path.join(appDir, "LICENSE"));

// 6) Simge.
const buildDir = path.join(root, "build");
fs.mkdirSync(buildDir, { recursive: true });
if (!fs.existsSync(path.join(buildDir, "icon.ico"))) say("build/icon.ico yok — CI simge adımını kontrol edin");

say(`hazır: ${path.relative(root, appDir)} (${Math.round(dirSize(appDir) / 1024 / 1024)} MB)`);

if (prepareOnly) process.exit(0);

// 7) electron-builder.
let electronInstalled = false;
try {
  require.resolve("electron");
  electronInstalled = fs.existsSync(path.join(root, "node_modules/electron/dist"));
} catch {
  electronInstalled = false;
}
if (!electronInstalled) {
  console.error("[desktop] Electron ikilisi yok. Kurulum dosyası yalnızca Windows CI'da üretilir.");
  console.error("[desktop] (Bu ortamda ikili indirme engellendi; dist-app hazır.)");
  process.exit(2);
}

say("electron-builder çalıştırılıyor…");
const res = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["electron-builder", "--win", "nsis", "--x64", "--config", "packages/desktop/electron-builder.yml", "--publish", "never"],
  { stdio: "inherit", cwd: root, env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: "false" } },
);
process.exit(res.status ?? 1);

function dirSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(p) : fs.statSync(p).size;
  }
  return total;
}
