import sharp from "sharp";
const [file, left, top, w, h, cols, rows] = process.argv.slice(2);
const buf = await sharp(file).extract({ left:+left, top:+top, width:+w, height:+h }).resize(+cols, +rows, { fit: "fill" }).greyscale().raw().toBuffer();
const ramp = " .:-=+*#%@";
for (let y = 0; y < +rows; y++) {
  let line = "";
  for (let x = 0; x < +cols; x++) line += ramp[Math.min(9, Math.floor((buf[y * +cols + x] / 256) * 10))];
  console.log(line);
}
