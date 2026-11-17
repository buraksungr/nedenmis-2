import path from "node:path";
import sharp from "sharp";
import { seeded } from "../src/theme";

const out = path.resolve(process.cwd(), "public");

function mulberry(seed: number) {
  return seeded(seed);
}

async function grain() {
  const size = 512;
  const buf = Buffer.alloc(size * size * 3);
  const rnd = mulberry(20261117);
  for (let i = 0; i < size * size; i++) {
    // Ortalama 128, dar aralıklı doku: kağıt/tuval greni
    const v = Math.round(128 + (rnd() - 0.5) * 46);
    buf[i * 3] = v;
    buf[i * 3 + 1] = v;
    buf[i * 3 + 2] = v;
  }
  await sharp(buf, { raw: { width: size, height: size, channels: 3 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(out, "grain.png"));

  // Vinyet: merkez açık, köşeler koyu
  const w = 1080;
  const h = 1920;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <radialGradient id="v" cx="50%" cy="42%" r="78%">
        <stop offset="52%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#1d1106" stop-opacity="0.55"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#v)"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(out, "vignette.png"));

  // Yumuşak sıcak ışıma (yer altı gövdesi vurgusu)
  const glow = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
    <defs><radialGradient id="g" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffcf7a" stop-opacity="0.85"/>
      <stop offset="45%" stop-color="#d8c858" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#a88838" stop-opacity="0"/>
    </radialGradient></defs>
    <rect width="800" height="800" fill="url(#g)"/>
  </svg>`;
  await sharp(Buffer.from(svg2Buffer(glow))).png().toFile(path.join(out, "glow.png"));

  console.log("[assets] grain.png, vignette.png, glow.png yazıldı");
}

function svg2Buffer(s: string) {
  return Buffer.from(s);
}

grain().catch((e) => {
  console.error(e);
  process.exit(1);
});
