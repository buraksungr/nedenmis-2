/** Küçük ASCII luma haritası — kompozisyonu sayısal olarak "görmek" için. */
import sharp from "sharp";

const file = process.argv[2];
const cols = Number(process.argv[3] ?? 54);
const rows = Number(process.argv[4] ?? 76);
const { data, info } = await sharp(file).resize(cols, rows, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true });
const ramp = " .:-=+*#%@";
for (let y = 0; y < rows; y++) {
  let line = "";
  for (let x = 0; x < cols; x++) {
    const v = data[y * cols + x];
    line += ramp[Math.min(ramp.length - 1, Math.floor((v / 256) * ramp.length))];
  }
  console.log(line);
}
