import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const entry = path.resolve(process.cwd(), "src/index.ts");
const out = process.env.OUT ?? path.resolve(process.cwd(), "out/test.mp4");
const browserExecutable = process.env.CHROMIUM_PATH ?? "/tmp/chromium";
const frameRange = process.env.FRAME_RANGE
  ? (process.env.FRAME_RANGE.split("-").map(Number) as [number, number])
  : undefined;

console.log("[render] bundling", entry);
const serveUrl = await bundle({
  entryPoint: entry,
  webpackOverride: (config) => config,
});
console.log("[render] bundled ->", serveUrl);

const composition = await selectComposition({
  serveUrl,
  id: "ants-winter",
  browserExecutable,
});
console.log("[render] composition", composition.id, composition.width, composition.height, composition.durationInFrames);

await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: out,
  browserExecutable,
  crf: Number(process.env.CRF ?? 18),
  concurrency: Number(process.env.CONCURRENCY ?? 2),
  ...(frameRange ? { frameRange } : {}),
  onProgress: ({ progress }) => {
    if (Math.round(progress * 100) % 5 === 0) {
      process.stdout.write(`\r[render] ${(progress * 100).toFixed(1)}%   `);
    }
  },
});
console.log("\n[render] done ->", out);
