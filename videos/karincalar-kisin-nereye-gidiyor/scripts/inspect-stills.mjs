/**
 * Karelere sayısal bakış: alt kenarda karınca mü, altyazı görünüyor mu,
 * koyu mürekkep dağılımı nerede? (Görseli göremeyen ortam için.)
 */
import fs from "node:fs";
import sharp from "sharp";

const dir = process.env.STILL_DIR ?? "/tmp/stills2";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort();

for (const f of files) {
  const { data, info } = await sharp(`${dir}/${f}`).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const luma = (x, y) => {
    const i = (y * width + x) * channels;
    return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  };
  // bant bazlı koyu (mürekkep) oranı
  const bands = 12;
  const bandDark = new Array(bands).fill(0);
  const bandN = new Array(bands).fill(0);
  let minYdark = height, maxYdark = -1;
  for (let y = 0; y < height; y += 2) {
    const b = Math.min(bands - 1, Math.floor((y / height) * bands));
    for (let x = 0; x < width; x += 2) {
      const l = luma(x, y);
      bandN[b]++;
      if (l < 38) {
        bandDark[b]++;
        if (y > 900 && y < 1650) {
          if (y < minYdark) minYdark = y;
          if (y > maxYdark) maxYdark = y;
        }
      }
    }
  }
  // altyazı bölgesi (y 1652-1790): koyu zemin + açık metin
  let chipDark = 0, chipLight = 0, chipN = 0;
  for (let y = 1660; y < 1780; y += 2) {
    for (let x = 90; x < width - 90; x += 2) {
      const l = luma(x, y);
      chipN++;
      if (l < 70) chipDark++;
      if (l > 190) chipLight++;
    }
  }
  // üst etiket bölgesi (y 80-130)
  let tagLight = 0, tagN = 0;
  for (let y = 78; y < 132; y += 1) {
    for (let x = 200; x < width - 200; x += 1) {
      tagN++;
      if (luma(x, y) > 170) tagLight++;
    }
  }
  // en alt 60 satırda koyu mürekkep var mı?
  let bottomDark = 0, bottomN = 0;
  for (let y = height - 60; y < height; y += 1) {
    for (let x = 0; x < width; x += 2) {
      bottomN++;
      if (luma(x, y) < 38) bottomDark++;
    }
  }
  console.log(`\n=== ${f}`);
  console.log(
    `  bant(koyu%): ${bandDark.map((d, i) => `${i}:${((100 * d) / bandN[i]).toFixed(0)}`).join(" ")}`
  );
  console.log(
    `  orta koyu mürekkep y-aralığı: ${minYdark === height ? "yok" : `${minYdark}..${maxYdark}`} (ekran ${height})`
  );
  console.log(
    `  altyazı: koyu=${((100 * chipDark) / chipN).toFixed(1)}% açık=${((100 * chipLight) / chipN).toFixed(2)}%`
  );
  console.log(`  üst etiket açık piksel: ${((100 * tagLight) / tagN).toFixed(2)}%`);
  console.log(`  alt 60px koyu: ${((100 * bottomDark) / bottomN).toFixed(2)}%`);
}
