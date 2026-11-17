import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { SCENES, TARGET_TOTAL_SEC } from "../src/script";

const FPS = 30;
/** İlk sahneye kadar sessiz tanıtım. */
const INTRO_SEC = 0.45;
/** Ardışık cümleler arası doğal nefes. */
const GAP_SEC = 0.18;
/** Sondan sonra sessiz kapanış. */
const OUTRO_SEC = 0.3;

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
  const audioSec = duration(path.resolve(process.cwd(), "audio", s.audio));
  return { scene: s, audioSec };
});

const speechSec = rows.reduce((a, r) => a + r.audioSec, 0);
const totalSec = Math.max(TARGET_TOTAL_SEC, speechSec + INTRO_SEC + GAP_SEC * rows.length + OUTRO_SEC);
const totalFrames = Math.round(totalSec * FPS);

type Row = {
  id: string;
  start: number;
  duration: number;
  narration: string;
  topLabel: string;
  audio: string;
  audioSec: number;
};

const timeline: Row[] = [];
let cursor = Math.round(INTRO_SEC * FPS);
for (const r of rows) {
  const dur = Math.round((r.audioSec + GAP_SEC) * FPS);
  timeline.push({
    id: r.scene.id,
    start: cursor,
    duration: dur,
    narration: r.scene.narration,
    topLabel: r.scene.topLabel,
    audio: r.scene.audio,
    audioSec: r.audioSec,
  });
  cursor += dur;
}
// kalan süre son sahneye eklenir (kompozisyon süresi = timeline süresi)
const last = timeline[timeline.length - 1];
last.duration += Math.max(0, totalFrames - cursor);

const ts = `// OTOMATİK ÜRETİLDİ — scripts/make-timeline.ts (elle düzenleme)
// Toplam: ${totalFrames} kare = ${(totalFrames / FPS).toFixed(2)} sn, \${FPS} fps.
// Giriş ${INTRO_SEC}s + ${rows.length} sahne (konuşma + ${GAP_SEC}s nefes) + sonda ${OUTRO_SEC}s.
export type TimelineEntry = {
  id: string;
  start: number;
  duration: number;
  narration: string;
  topLabel: string;
  audio: string;
  audioSec: number;
};

export const FPS = ${FPS};
export const TOTAL_FRAMES = ${totalFrames};
export const TOTAL_SEC = ${(totalFrames / FPS).toFixed(3)};
export const TIMELINE: TimelineEntry[] = ${JSON.stringify(timeline, null, 2)};
`;
fs.writeFileSync(path.resolve(process.cwd(), "src/timeline.ts"), ts);

const md = `# Sahne zaman çizelgesi

Hedef: en az ${TARGET_TOTAL_SEC} sn · ${FPS} fps · toplam ${totalFrames} kare (${(totalFrames / FPS).toFixed(2)} sn).
Anlatım süreleri FFprobe ile ölçüldü; sahne süresi = anlatım + ${GAP_SEC} sn nefes.

| # | Sahne | Başlangıç (sn) | Süre (sn) | Anlatım (sn) | Üst etiket |
|---|-------|----------------|-----------|--------------|------------|
${timeline
  .map(
    (t, i) =>
      `| ${i + 1} | ${t.id} | ${(t.start / FPS).toFixed(2)} | ${(t.duration / FPS).toFixed(2)} | ${t.audioSec.toFixed(2)} | ${t.topLabel} |`
  )
  .join("\n")}

## Anlatım metni (altyazı bu metinden üretilir)

${timeline.map((t) => `- **${t.id}**: ${t.narration}`).join("\n")}
`;
fs.mkdirSync(path.resolve(process.cwd(), "docs"), { recursive: true });
fs.writeFileSync(path.resolve(process.cwd(), "docs/timeline.md"), md);

console.log(`[timeline] ${timeline.length} sahne, toplam ${totalFrames} kare (${(totalFrames / FPS).toFixed(2)} sn)`);
console.log(`[timeline] konuşma ${speechSec.toFixed(2)} sn + giriş ${INTRO_SEC}s + nefes ${GAP_SEC}s`);
for (const t of timeline) {
  console.log(
    `  ${t.id.padEnd(16)} start=${String(t.start).padStart(4)} dur=${String(t.duration).padStart(4)} (${(t.duration / FPS).toFixed(2)}s) audio=${t.audioSec.toFixed(2)}s`
  );
}
