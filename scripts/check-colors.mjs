// Arayüz paleti denetimi: kaynakta gri tonları dışında renk var mı?
//   node scripts/check-colors.mjs          (insan okunur)
//   node scripts/check-colors.mjs --json   (rapor)
//
// Neden: ekran görüntüsü piksel testi, sahne önizlemeleri gibi *içerik* görsellerini
// de ölçer. Arayüz kromunun tek renk olduğunu asıl kaynak garantisiyle doğrularız.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.env.UI_DIR ?? "packages/ui");
const skip = /node_modules|dist|\.map$/;
const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (skip.test(full)) continue;
    if (entry.isDirectory()) walk(full);
    else if (/\.(css|tsx?|html|jsx?)$|index\.html$/.test(entry.name)) files.push(full);
  }
})(root);

const named = {
  white: [255, 255, 255],
  black: [0, 0, 0],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  silver: [192, 192, 192],
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  orange: [255, 165, 0],
  purple: [128, 0, 128],
  pink: [255, 192, 203],
  teal: [0, 128, 128],
  navy: [0, 0, 128],
  olive: [128, 128, 0],
  maroon: [128, 0, 0],
  lime: [0, 255, 0],
  cyan: [0, 255, 255],
  aqua: [0, 255, 255],
  magenta: [255, 0, 255],
  fuchsia: [255, 0, 255],
  gold: [255, 215, 0],
  crimson: [220, 20, 60],
  violet: [238, 130, 238],
  indigo: [75, 0, 130],
  salmon: [250, 128, 114],
  coral: [255, 127, 80],
  tomato: [255, 99, 71],
  brown: [165, 42, 42],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  beige: [245, 245, 220],
  ivory: [255, 255, 240],
  azure: [240, 255, 255],
  plum: [221, 160, 221],
  orchid: [218, 112, 214],
};

function saturation([r, g, b]) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return mx === 0 ? 0 : (mx - mn) / mx;
}

function fromHex(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 4) h = h.slice(0, 3).split("").map((c) => c + c).join("");
  if (h.length === 6 || h.length === 8) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return null;
}

const findings = [];
for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split("\n");
  lines.forEach((line, index) => {
    const text = line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
    const hits = [];
    for (const m of text.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
      const rgb = fromHex(m[0]);
      if (rgb) hits.push({ value: m[0], rgb });
    }
    for (const m of text.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/g)) {
      hits.push({ value: m[0], rgb: [Number(m[1]), Number(m[2]), Number(m[3])] });
    }
    for (const m of text.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/g)) {
      const h = Number(m[1]) % 360;
      const s = Number(m[2]) / 100;
      if (s > 0.1) hits.push({ value: m[0], rgb: [255, 0, 255], sat: s });
    }
    for (const m of text.matchAll(/\b(?:color|background|fill|stroke|border-color)\s*[:=]\s*["']?([a-z]+)\b/gi)) {
      const name = m[1].toLowerCase();
      if (named[name]) hits.push({ value: name, rgb: named[name] });
    }
    for (const hit of hits) {
      const sat = hit.sat ?? saturation(hit.rgb);
      if (sat > 0.1) {
        findings.push({
          file: path.relative(process.cwd(), file).replace(/\\/g, "/"),
          line: index + 1,
          value: hit.value,
          saturation: Math.round(sat * 1000) / 1000,
        });
      }
    }
  });
}

const report = {
  ok: findings.length === 0,
  scanned: files.length,
  rule: "UI kaynağında doygunluk > %10 olan renk bulunmamalı (gri tonları serbest)",
  findings,
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else if (report.ok) {
  console.log(`Arayüz paleti tek renk: ${report.scanned} dosya tarandı, renkli değer yok.`);
} else {
  console.log(`Arayüz paletinde ${findings.length} renkli değer:`);
  for (const f of findings) console.log(`  ${f.file}:${f.line} ${f.value} (doygunluk ${f.saturation})`);
}
process.exit(report.ok ? 0 : 1);
