// Arayüz ekran görüntüleri (gerçek tarayıcı, masaüstü çözünürlüğü).
//   node scripts/ui-shots.mjs
//
// Chrome/Edge "headless" modu kullanılır; ek bağımlılık gerekmez.
// Üretilen PNG'ler doğrulanır: boyut, boş olmama ve tek renk (monokrom) tema ölçümü.
//
// Ortam değişkenleri:
//   NEDENMIS_API   arayüzün sunulduğu kök adres (varsayılan http://127.0.0.1:4319)
//   CHROME_PATH    tarayıcı yolu (verilmezse bilinen yollar aranır)
//   SHOT_DIR       çıktı klasörü (varsayılan reports/ui-shots)
//   SHOT_WIDTH / SHOT_HEIGHT  pencere boyutu (varsayılan 1600x1000)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const base = (process.env.NEDENMIS_API ?? "http://127.0.0.1:4319").replace(/\/$/, "");
const outDir = path.resolve(process.env.SHOT_DIR ?? "reports/ui-shots");
const width = Number(process.env.SHOT_WIDTH ?? 1600);
const height = Number(process.env.SHOT_HEIGHT ?? 1000);
fs.mkdirSync(outDir, { recursive: true });

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates =
    process.platform === "win32"
      ? [
          "C:/Program Files/Google/Chrome/Application/chrome.exe",
          "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
          "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
          "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
        ]
      : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function pngInfo(buffer, regions) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error("PNG imzası yok");
  let offset = 8;
  let ihdr = null;
  const idat = [];
  while (offset < buffer.length) {
    const len = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + len);
    if (type === "IHDR") {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    offset += 12 + len;
  }
  if (!ihdr) throw new Error("IHDR bulunamadı");
  if (ihdr.bitDepth !== 8 || ihdr.interlace !== 0) throw new Error("desteklenmeyen PNG biçimi");
  const channels = ihdr.colorType === 6 ? 4 : ihdr.colorType === 2 ? 3 : 0;
  if (!channels) throw new Error(`desteklenmeyen renk türü: ${ihdr.colorType}`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = ihdr.width * channels;
  const pixels = Buffer.alloc(stride * ihdr.height);
  let pos = 0;
  for (let y = 0; y < ihdr.height; y++) {
    const filter = raw[pos++];
    const row = raw.subarray(pos, pos + stride);
    pos += stride;
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let value = row[x];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += Math.floor((a + b) / 2);
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[x] = value & 0xff;
    }
  }
  // Örnekleme ile istatistik (tam çözünürlük gerekmiyor).
  const step = Math.max(1, Math.floor(ihdr.height / 200));
  const inRegion = (x, y) => {
    if (!regions || regions.length === 0) return true;
    const fx = x / ihdr.width;
    const fy = y / ihdr.height;
    return regions.some((r) => fx >= r.x0 && fx <= r.x1 && fy >= r.y0 && fy <= r.y1);
  };
  let sum = 0;
  let count = 0;
  let colorful = 0;
  let dark = 0;
  const colorSet = new Set();
  for (let y = 0; y < ihdr.height; y += step) {
    for (let x = 0; x < ihdr.width; x += step) {
      if (!inRegion(x, y)) continue;
      const i = y * stride + x * channels;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sum += lum;
      count++;
      if (lum < 40) dark++;
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      if (mx > 0 && (mx - mn) / mx > 0.22) colorful++;
      colorSet.add((r >> 4) * 256 + (g >> 4) * 16 + (b >> 4));
    }
  }
  return {
    width: ihdr.width,
    height: ihdr.height,
    meanLuminance: Math.round((sum / count) * 10) / 10,
    darkRatio: Math.round((dark / count) * 1000) / 1000,
    colorfulRatio: Math.round((colorful / count) * 10000) / 10000,
    distinctColorBuckets: colorSet.size,
  };
}

async function seedProject() {
  const list = await (await fetch(`${base}/api/projects`)).json().catch(() => ({ projects: [] }));
  const existing = list.projects?.[0]?.id;
  if (existing) return { id: existing, seeded: false };
  const res = await fetch(`${base}/api/projects`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ topic: "Elmas neden kolay kırılmaz?", targetDurationSec: 30, quality: "draft", languageLevel: "simple" }),
  });
  if (!res.ok) throw new Error(`Proje oluşturulamadı: HTTP ${res.status}`);
  const data = await res.json();
  return { id: data.project.id, seeded: true };
}

process.on("uncaughtException", (err) => {
  const payload = { ok: false, error: `beklenmeyen hata: ${String(err).slice(0, 800)}`, generatedAt: new Date().toISOString() };
  try {
    fs.writeFileSync(path.join(outDir, "ui-screenshots.json"), JSON.stringify(payload, null, 2));
  } catch {
    /* yoksay */
  }
  console.log(`::warning title=Ekran görüntüsü::${String(err).slice(0, 800)}`);
  process.exit(0);
});

const chrome = findChrome();
const report = {
  generatedAt: new Date().toISOString(),
  base,
  chrome: chrome ?? null,
  window: { width, height },
  shots: [],
  ok: false,
};

if (!chrome) {
  report.note = "Chrome/Edge bulunamadı — ekran görüntüsü alınamadı (bu bir başarısızlık değil, ortam sınırı).";
  fs.writeFileSync(path.join(outDir, "ui-screenshots.json"), JSON.stringify(report, null, 2));
  console.log(report.note);
  process.exit(0);
}

let id = null;
try {
  const seededInfo = await seedProject();
  id = seededInfo.id;
  report.projectId = id;
  report.seededProject = seededInfo.seeded;
} catch (e) {
  report.error = `Proje tohumlanamadı: ${String(e)}`;
  console.log(`::warning title=Ekran görüntüsü::${report.error.slice(0, 500)}`);
  fs.writeFileSync(path.join(outDir, "ui-screenshots.json"), JSON.stringify(report, null, 2));
  process.exit(0);
}

const shots = [
  { name: "01-video-olustur", hash: "#/new", expect: /kanıtlı|Bir soru yazın/ },
  { name: "02-projeler", hash: "#/library", expect: /Projeler|Kütüphane|Henüz/ },
  {
    name: "03-studyo",
    hash: `#/studio/${id}`,
    expect: /Senaryo kalitesi|Zaman çizelgesi/,
    // Stüdyo sayfası sahne önizlemeleri/video gösterir; bunlar *içerik* görselidir
    // (mavi gökyüzü, deniz...). Tek renk kuralı arayüz kromu için geçerli:
    // üst şerit (başlık) ve sol kenar çubuğu ölçülür.
    regions: [
      { x0: 0, y0: 0, x1: 1, y1: 0.08 },
      { x0: 0, y0: 0, x1: 0.17, y1: 1 },
    ],
  },
  { name: "04-ayarlar", hash: "#/settings", expect: /Dil karmaşıklığı/ },
];

function capture(file, mode, budgetMs, hash) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "nedenmis-chrome-"));
  const args = [
    mode,
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-sync",
    "--run-all-compositor-stages-before-draw",
    `--user-data-dir=${profile}`,
    "--force-device-scale-factor=1",
    `--window-size=${width},${height}`,
    `--virtual-time-budget=${budgetMs}`,
    `--screenshot=${file}`,
    `${base}/${hash}`,
  ];
  const res = spawnSync(chrome, args, { encoding: "utf8", timeout: 150_000 });
  try {
    fs.rmSync(profile, { recursive: true, force: true });
  } catch {
    /* yoksay */
  }
  return res;
}

for (const shot of shots) {
  const file = path.join(outDir, `${shot.name}.png`);
  // Yeni headless modu; sanal zaman bütçesi React'in çizmesini bekler.
  for (const attempt of [
    { mode: "--headless=new", budget: 12000 },
    { mode: "--headless", budget: 15000 },
  ]) {
    try {
      fs.rmSync(file, { force: true });
    } catch {
      /* yoksay */
    }
    const res = capture(file, attempt.mode, attempt.budget, shot.hash);
    if (!fs.existsSync(file)) {
      report.shots.push({ name: shot.name, ok: false, mode: attempt.mode, error: (res.stderr ?? "").slice(-400) || "PNG üretilmedi" });
      continue;
    }
    let buffer;
    let info;
    let chromeInfo = null;
    try {
      buffer = fs.readFileSync(file);
      info = pngInfo(buffer);
      if (shot.regions) chromeInfo = pngInfo(buffer, shot.regions);
    } catch (e) {
      report.shots.push({ name: shot.name, ok: false, mode: attempt.mode, error: `PNG okunamadı: ${String(e).slice(0, 300)}` });
      continue;
    }
    const meaningful = info.distinctColorBuckets >= 6 && buffer.length > 12_000;
    const judged = chromeInfo ?? info;
    report.shots = report.shots.filter((s) => s.name !== shot.name);
    const entry = {
      name: shot.name,
      hash: shot.hash,
      mode: attempt.mode,
      file: path.relative(process.cwd(), file).replace(/\\/g, "/"),
      bytes: buffer.length,
      ...info,
      ...(chromeInfo
        ? {
            contentColourNote: "içerik önizlemeleri renkli olabilir; ölçüm arayüz kromunda",
            chrome: {
              colorfulRatio: chromeInfo.colorfulRatio,
              meanLuminance: chromeInfo.meanLuminance,
              distinctColorBuckets: chromeInfo.distinctColorBuckets,
            },
          }
        : {}),
      ok:
        info.width === width &&
        info.height === height &&
        buffer.length > 12_000 &&
        info.distinctColorBuckets >= 6 &&
        judged.colorfulRatio <= 0.02 &&
        judged.meanLuminance > 120,
    };
    report.shots.push(entry);
    console.log(
      `  ${entry.ok ? "✓" : "✗"} ${shot.name} ${info.width}x${info.height} ` +
        `parlaklık=${judged.meanLuminance} renkli=${judged.colorfulRatio} ton=${info.distinctColorBuckets} ` +
        (chromeInfo ? `(krom; tam görüntü renkli=${info.colorfulRatio}) ` : "") +
        `${(buffer.length / 1024).toFixed(0)} KB (${attempt.mode})`,
    );
    if (meaningful) break;
  }
}

report.ok = report.shots.length === shots.length && report.shots.every((s) => s.ok);
const palette = (() => {
  const res = spawnSync(process.execPath, ["scripts/check-colors.mjs", "--json"], { encoding: "utf8" });
  try {
    return JSON.parse(res.stdout);
  } catch {
    return { ok: false, error: "palet denetimi çalıştırılamadı", stderr: (res.stderr ?? "").slice(-300) };
  }
})();
report.palette = palette;
report.checks = {
  desktopResolution: report.shots.every((s) => s.width === width && s.height === height),
  notBlank: report.shots.every((s) => (s.distinctColorBuckets ?? 0) >= 6),
  monochrome: report.shots.every((s) => ((s.chrome ?? s).colorfulRatio ?? 1) <= 0.02),
  lightTheme: report.shots.every((s) => ((s.chrome ?? s).meanLuminance ?? 0) > 120),
  monochromePalette: palette.ok === true && (palette.findings ?? []).length === 0,
};
fs.writeFileSync(path.join(outDir, "ui-screenshots.json"), JSON.stringify(report, null, 2));
console.log(`Rapor: ${path.join(outDir, "ui-screenshots.json")}`);
console.log(JSON.stringify({ ok: report.ok, checks: report.checks, shots: report.shots.map((s) => ({ name: s.name, ok: s.ok, mode: s.mode, bytes: s.bytes, buckets: s.distinctColorBuckets, colorful: s.colorfulRatio, lum: s.meanLuminance, error: s.error })) }, null, 2));

if (!report.ok) {
  // Ekran görüntüsü sorunu yayını durdurmaz (tarayıcı ortamı değişken), ama rapor ve
  // GitHub açıklaması gerçeği saklamaz.
  const details = report.shots
    .filter((s) => !s.ok)
    .map((s) => `${s.name}: ${s.error ?? `ton=${s.distinctColorBuckets} parlaklık=${s.meanLuminance} renkli=${s.colorfulRatio}`}`)
    .join(" | ");
  console.log(`::warning title=Arayüz ekran görüntüsü::${details.slice(0, 900)}`);
  process.exit(0);
}
