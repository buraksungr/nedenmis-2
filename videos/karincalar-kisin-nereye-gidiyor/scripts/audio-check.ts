import fs from "node:fs";
import { TIMELINE, FPS } from "../src/timeline";

const buf = fs.readFileSync("audio/master.wav");
// 44 byte header, 16-bit stereo
const n = Math.floor((buf.length - 44) / 4);
const lim = Math.floor((buf.length - 44) / 4);
let sum = 0, peak = 0;
const frameE: number[] = [];
const WIN = 4800; // 0.1s
for (let w = 0; w * WIN < n; w++) {
  let s = 0;
  for (let i = 0; i < WIN; i++) {
    const idx = w * WIN + i; if (idx >= lim) break; const p = 44 + idx * 4;
    const l = buf.readInt16LE(p) / 32768;
    const r = buf.readInt16LE(p + 2) / 32768;
    const v = (l + r) / 2;
    s += v * v;
    if (Math.abs(v) > peak) peak = Math.abs(v);
  }
  frameE.push(s / WIN);
}
for (const e of frameE) sum += e;
const rms = Math.sqrt(sum / frameE.length);
console.log(`master: RMS=${(20 * Math.log10(rms)).toFixed(1)} dBFS  peak=${peak.toFixed(3)} (${(20 * Math.log10(peak)).toFixed(1)} dBFS)`);
console.log(`klip: ${frameE.some((e) => Math.sqrt(e) > 0.999) ? "VAR" : "yok"}`);

// konuşma başlangıçlarını eşleştir
const TH = rms * 1.6;
const onsets: number[] = [];
let inS = false;
for (let i = 0; i < frameE.length; i++) {
  const v = Math.sqrt(frameE[i]);
  if (!inS && v > TH) { onsets.push(i * 0.1); inS = true; }
  else if (inS && v < TH * 0.5) inS = false;
}
console.log("\nbeklenen sahne başlangıçları ve ölçülen enerji artışları:");
for (const e of TIMELINE) {
  const exp = e.start / FPS;
  const near = onsets.filter((o) => Math.abs(o - exp) < 1.2);
  console.log(`  ${e.id.padEnd(16)} beklenen=${exp.toFixed(2)}s  ölçülen=${near.length ? near.map((o) => o.toFixed(2)).join(",") : "—"}`);
}
