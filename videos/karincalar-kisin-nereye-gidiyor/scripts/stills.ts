import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { TIMELINE } from "../src/timeline";

const outDir = process.env.STILL_DIR ?? "/tmp/stills";
fs.mkdirSync(outDir, { recursive: true });
const browserExecutable = process.env.CHROMIUM_PATH ?? "/tmp/chromium";

const serveUrl = await bundle({ entryPoint: path.resolve(process.cwd(), "src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "ants-winter", browserExecutable });

const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
const framesEnv = process.env.FRAMES ? process.env.FRAMES.split(",").map(Number) : null;
if (framesEnv) {
  for (const frame of framesEnv) {
    const out = path.join(outDir, `frame-${String(frame).padStart(4, "0")}.png`);
    await renderStill({ composition, serveUrl, frame, output: out, imageFormat: "png", browserExecutable });
    console.log("[still] frame", frame, "->", out);
  }
  console.log("[stills] done");
  process.exit(0);
}
for (const e of TIMELINE) {
  if (only && !only.includes(e.id)) continue;
  const frame = e.start + Math.max(1, Math.floor(e.duration / 2));
  const out = path.join(outDir, `${e.id}.png`);
  await renderStill({
    composition,
    serveUrl,
    frame,
    output: out,
    imageFormat: "png",
    browserExecutable,
  });
  console.log("[still]", e.id, "frame", frame, "->", out);
}
console.log("[stills] done");
