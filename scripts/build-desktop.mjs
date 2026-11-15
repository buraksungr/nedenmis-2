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
import { execFileSync, spawn, spawnSync } from "node:child_process";
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

// 2b) Çalışma zamanı bağımlılıkları → vendor/node_modules.
//
// ÖNEMLİ: electron-builder, uygulama klasöründe HER derinlikteki `node_modules`
// dizinini koşulsuz dışlar (app-builder-lib/out/fileMatcher.js: "!**/node_modules").
// Bu yüzden modülleri dist-app/node_modules içine koymak işe yaramaz: kurulan
// uygulamada hiç bulunmazlar (v1.0.0'daki "@resvg/resvg-js bulunamadı" hatası).
// extraResources ile resources/node_modules altına taşıyoruz; Node, uygulama
// dosyalarından yukarı yürürken orayı bulur.
say("çalışma zamanı modülleri (vendor/node_modules) hazırlanıyor…");
const vendorModules = path.join(vendorDir, "node_modules");
fs.rmSync(vendorModules, { recursive: true, force: true });
const runtimeModules = ["@resvg"];
for (const name of runtimeModules) {
  const from = path.join(root, "node_modules", name);
  if (!fs.existsSync(from)) {
    console.error(`[desktop] HATA: node_modules/${name} bulunamadı — "npm ci" çalıştırın.`);
    process.exit(1);
  }
  copyDir(from, path.join(vendorModules, name));
  say(`  ${name} → vendor/node_modules/${name}`);
}

// Platforma özgü native eklenti gerçekten geldi mi? (ör. @resvg/resvg-js-win32-x64-msvc)
const resvgScope = path.join(vendorModules, "@resvg");
const nativeDirs = fs.existsSync(resvgScope)
  ? fs.readdirSync(resvgScope).filter((d) => d !== "resvg-js" && fs.existsSync(path.join(resvgScope, d)))
  : [];
const nativeFiles = nativeDirs.flatMap((d) =>
  fs.readdirSync(path.join(resvgScope, d)).filter((f) => f.endsWith(".node")),
);
if (!nativeFiles.length) {
  console.error("[desktop] HATA: @resvg için platform native eklentisi (.node) bulunamadı.");
  console.error(`[desktop] Aranan klasörler: ${nativeDirs.join(", ") || "(yok)"}`);
  process.exit(1);
}
say(`  native eklenti: ${nativeFiles.join(", ")}`);

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

// electron-builder'ı "npx" yerine doğrudan Node ile çalıştırıyoruz: Windows'ta
// spawn("npx.cmd") kabuk olmadan çalışmaz ve sessizce ENOENT ile düşer.
let ebCli = null;
for (const candidate of ["electron-builder/cli.js", "electron-builder/out/cli/cli.js"]) {
  try {
    ebCli = require.resolve(candidate);
    break;
  } catch {
    /* sıradaki adaya bak */
  }
}
if (!ebCli) {
  console.error("[desktop] electron-builder bulunamadı (npm ci çalıştı mı?)");
  process.exit(1);
}

const ebArgs = ["--win", "nsis", "--x64", "--config", "packages/desktop/electron-builder.yml", "--publish", "never"];
const ebEnv = { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: "false" };

const versionProbe = spawnSync(process.execPath, [ebCli, "--version"], { encoding: "utf8", cwd: root });
const ebVersion = (versionProbe.stdout || versionProbe.stderr || "").trim().split("\n").pop();
say(`electron-builder: ${ebVersion || "sürüm okunamadı"} (${path.relative(root, ebCli)})`);

say("electron-builder çalıştırılıyor…");
// ÖNEMLİ: stdio "inherit" çocuk sürecin çıktısını ana sürecin stdout'una yazar;
// CI bunu yakalayamadığı için hata sebebi görünmüyordu. Boru hattıyla akıtıyoruz.
const child = spawn(process.execPath, [ebCli, ...ebArgs], { cwd: root, env: ebEnv });
child.stdout.on("data", (d) => process.stdout.write(d));
child.stderr.on("data", (d) => process.stderr.write(d));
child.on("error", (e) => {
  console.error("[desktop] electron-builder başlatılamadı:", e.message);
  process.exit(1);
});
child.on("close", (code, signal) => {
  if (code !== 0) {
    console.error(`[desktop] electron-builder başarısız (kod ${code}, sinyal ${signal ?? "yok"})`);
    process.exit(code ?? 1);
  }
  process.exit(verifyPackaged());
});

/**
 * Yapı kapısı: paketlenmiş ağaçta zorunlu çalışma zamanı dosyaları var mı?
 * v1.0.0'da eksik olan @resvg burada yakalanır — kurulum dosyası hiç üretilmez.
 */
function verifyPackaged() {
  const unpacked = path.join(root, "release", "win-unpacked");
  if (!fs.existsSync(unpacked)) {
    console.error(`[desktop] HATA: ${path.relative(root, unpacked)} yok — electron-builder çıktısı beklenen yerde değil.`);
    return 1;
  }
  const res = path.join(unpacked, "resources");
  const exe = process.platform === "win32" ? ".exe" : "";
  const required = [
    "app/dist-app/server.mjs",
    "app/dist-app/main.cjs",
    "app/dist-app/ui/index.html",
    "node_modules/@resvg/resvg-js/package.json",
    `bin/ffmpeg${exe}`,
    `bin/ffprobe${exe}`,
    `python/python${exe}`,
    "fonts/DejaVuSans.ttf",
    "scripts/espeak_bridge.py",
    "LICENSES.txt",
  ];

  // @resvg native eklentisi (.node) — platforma göre adı değişir.
  const resvgScope = path.join(res, "node_modules", "@resvg");
  let nativeFound = null;
  if (fs.existsSync(resvgScope)) {
    for (const dir of fs.readdirSync(resvgScope)) {
      const dirPath = path.join(resvgScope, dir);
      if (!fs.statSync(dirPath).isDirectory()) continue;
      for (const file of fs.readdirSync(dirPath)) {
        if (file.endsWith(".node")) nativeFound = `node_modules/@resvg/${dir}/${file}`;
      }
    }
  }

  const missing = required.filter((rel) => !fs.existsSync(path.join(res, rel)));
  if (!nativeFound) missing.push("node_modules/@resvg/*/*.node (native eklenti)");
  if (fs.existsSync(path.join(res, "app", "dist-app", "node_modules"))) {
    console.warn("[desktop] UYARI: app/dist-app/node_modules hâlâ var — bu dizin paketlenmez, kaldırılabilir.");
  }

  if (missing.length) {
    console.error("[desktop] HATA: paketlenmiş uygulamada zorunlu dosyalar eksik:");
    for (const m of missing) console.error(`  - ${m}`);
    return 1;
  }
  say(`paket doğrulandı: ${required.length + 1} zorunlu dosya yerinde (resvg native: ${nativeFound})`);
  return 0;
}

function dirSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(p) : fs.statSync(p).size;
  }
  return total;
}
