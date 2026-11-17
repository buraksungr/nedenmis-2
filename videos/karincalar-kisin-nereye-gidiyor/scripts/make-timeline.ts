import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { SCENES, TARGET_TOTAL_SEC } from "../src/script";

const FPS = 30;
const TOTAL = TARGET_TOTAL_SEC * FPS;
const GAP_SEC = 0.25; // ardışık cümleler arası doğal nefes

const ffprobe = path.resolve(process.cwd(), "node_modules/@remotion/compositor-linux-x64-gnu/ffprobe");

function duration(file: string): number {
  const r = spawnSync(
    ffprobe,
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file],
    { encoding: "utf8" }
  );
  const d = Number.parseFloat((r.stdout ?? "").trim());
  if (!Number.isFinite(d)) throw new Error(`süre ölçülemedi: ${file}`);
  return d;
}

const rows = SCENES.map((s) => {
  const audioSec = s.audio ? duration(path.resolve(process.cwd(), "audio", s.audio)) : 0;
  return { scene: s, audioSec };
});

const narratedFrames = rows
  .filter((r) => r.scene.kind === "narrated")
  .map((r) => Math.round((r.audioSec + GAP_SEC) * FPS));
const cardFrames = Math.max(0, TOTAL - narratedFrames.reduce((a, b) => a + b, 0));

const timeline: { id: string; start: number; duration: number; narration: string; caption: string; sub?: string; audio: string | null; kind: string; audioSec: number }[] = [];
let cursor = 0;
let narratedIdx = 0;
for (const r of rows) {
  const duration = r.scene.kind === "card" ? cardFrames : narratedFrames[narratedIdx++];
  timeline.push({
    id: r.scene.id,
    start: cursor,
    duration,
    narration: r.scene.narration,
    caption: r.scene.caption,
    sub: r.scene.sub,
    audio: r.scene.audio,
    kind: r.scene.kind,
    audioSec: r.scene.audio ? r.audioSec : 0,
  });
  cursor += duration;
}

const ts = `// OTOMATİK ÜRETİLDİ — scripts/make-timeline.ts (elle düzenleme)
// Toplam: ${cursor} kare = ${(cursor / FPS).toFixed(2)} sn, \${FPS} fps.
export type TimelineEntry = {
  id: string;
  start: number;
  duration: number;
  narration: string;
  caption: string;
  sub?: string;
  audio: string | null;
  kind: "narrated" | "card";
  audioSec: number;
};

export const FPS = ${FPS};
export const TOTAL_FRAMES = ${cursor};
export const TIMELINE: TimelineEntry[] = ${JSON.stringify(timeline, null, 2)};
`;
fs.writeFileSync(path.resolve(process.cwd(), "src/timeline.ts"), ts);

const md = `# Sahne zaman çizelgesi

Hedef: ${TARGET_TOTAL_SEC} sn · ${FPS} fps · toplam ${cursor} kare.
Anlatım süreleri FFprobe ile ölçüldü; sahne süresi = anlatım + ${GAP_SEC} sn nefes.

| # | Sahne | Başlangıç (sn) | Süre (sn) | Anlatım (sn) | Kapak |
|---|-------|----------------|-----------|--------------|------|
${timeline
  .map(
    (t, i) =>
      `| ${i + 1} | ${t.id} | ${(t.start / FPS).toFixed(2)} | ${(t.duration / FPS).toFixed(2)} | ${t.audioSec.toFixed(2)} | ${t.caption} |`
  )
  .join("\n")}

## Anlatım metni

${timeline.map((t) => `- **${t.id}**: ${t.narration || "(sessiz kart)"}`).join("\n")}
`;
fs.mkdirSync(path.resolve(process.cwd(), "docs"), { recursive: true });
fs.writeFileSync(path.resolve(process.cwd(), "docs/timeline.md"), md);

console.log(`[timeline] ${timeline.length} sahne, toplam ${cursor} kare (${(cursor / FPS).toFixed(2)} sn)`);
for (const t of timeline) {
  console.log(`  ${t.id.padEnd(16)} start=${String(t.start).padStart(4)} dur=${String(t.duration).padStart(4)} (${(t.duration / FPS).toFixed(2)}s) audio=${t.audioSec.toFixed(2)}s`);
}
