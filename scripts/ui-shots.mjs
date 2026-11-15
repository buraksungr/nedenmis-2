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

function pngInfo(buffer) {
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
  let sum = 0;
  let count = 0;
  let colorful = 0;
  let dark = 0;
  const colorSet = new Set();
  for (let y = 0; y < ihdr.height; y += step) {
    for (let x = 0; x < ihdr.width; x += step) {
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

const { id, seeded } = await seedProject();
report.projectId = id;
report.seededProject = seeded;

const shots = [
  { name: "01-video-olustur", hash: "#/new", expect: /kanıtlı|Bir soru yazın/ },
  { name: "02-projeler", hash: "#/library", expect: /Projeler|Kütüphane|Henüz/ },
  { name: "03-studyo", hash: `#/studio/${id}`, expect: /Senaryo kalitesi|Zaman çizelgesi/ },
  { name: "04-ayarlar", hash: "#/settings", expect: /Dil karmaşıklığı/ },
];

for (const shot of shots) {
  const file = path.join(outDir, `${shot.name}.png`);
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--force-device-scale-factor=1",
    `--window-size=${width},${height}`,
    "--virtual-time-budget=9000",
    `--screenshot=${file}`,
    `${base}/${shot.hash}`,
  ];
  const res = spawnSync(chrome, args, { encoding: "utf8", timeout: 120_000 });
  if (!fs.existsSync(file)) {
    report.shots.push({ name: shot.name, ok: false, error: (res.stderr ?? "").slice(-400) || "PNG üretilmedi" });
    continue;
  }
  const buffer = fs.readFileSync(file);
  const info = pngInfo(buffer);
  const entry = {
    name: shot.name,
    hash: shot.hash,
    file: path.relative(process.cwd(), file).replace(/\\/g, "/"),
    bytes: buffer.length,
    ...info,
    ok:
      info.width === width &&
      info.height === height &&
      buffer.length > 12_000 &&
      info.distinctColorBuckets >= 6 &&
      info.colorfulRatio <= 0.02 &&
      info.meanLuminance > 120,
  };
  report.shots.push(entry);
  console.log(
    `  ${entry.ok ? "✓" : "✗"} ${shot.name} ${info.width}x${info.height} ` +
      `parlaklık=${info.meanLuminance} renkli=${info.colorfulRatio} ton=${info.distinctColorBuckets} ${(buffer.length / 1024).toFixed(0)} KB`,
  );
}

report.ok = report.shots.length === shots.length && report.shots.every((s) => s.ok);
report.checks = {
  desktopResolution: report.shots.every((s) => s.width === width && s.height === height),
  notBlank: report.shots.every((s) => (s.distinctColorBuckets ?? 0) >= 6),
  monochrome: report.shots.every((s) => (s.colorfulRatio ?? 1) <= 0.02),
  lightTheme: report.shots.every((s) => (s.meanLuminance ?? 0) > 120),
};
fs.writeFileSync(path.join(outDir, "ui-screenshots.json"), JSON.stringify(report, null, 2));
console.log(`Rapor: ${path.join(outDir, "ui-screenshots.json")}`);
process.exit(report.ok ? 0 : 1);
