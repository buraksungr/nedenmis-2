import fs from "node:fs";
import sharp from "sharp";

const dir = process.env.STILL_DIR ?? "/tmp/stills";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort();

for (const f of files) {
  const img = sharp(`${dir}/${f}`);
  const meta = await img.metadata();
  const { data, info } = await img
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const bands = 8;
  const bandStats = [];
  let dark = 0, light = 0, total = 0, sum = 0;
  for (let y = 0; y < height; y++) {
    const band = Math.min(bands - 1, Math.floor((y / height) * bands));
    if (!bandStats[band]) bandStats[band] = { sum: 0, n: 0, dark: 0 };
    for (let x = 0; x < width; x += 3) {
      const i = (y * width + x) * channels;
      const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      bandStats[band].sum += l;
      bandStats[band].n++;
      sum += l;
      total++;
      if (l < 45) { dark++; bandStats[band].dark++; }
      if (l > 215) light++;
    }
  }
  const mean = (sum / total).toFixed(1);
  console.log(`\n=== ${f} (${width}x${height}) meanLuma=${mean} dark=${(100*dark/total).toFixed(1)}% light=${(100*light/total).toFixed(1)}%`);
  console.log("  bands: " + bandStats.map((b, i) => `${i}:${(b.sum/b.n).toFixed(0)}${b.dark/b.n > 0.08 ? "*" : ""}`).join(" "));
}
