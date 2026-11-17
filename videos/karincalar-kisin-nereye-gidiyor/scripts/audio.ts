/**
 * Ses tasarımı: anlatım + ambiyans + geçiş efektleri.
 * Telifsiz: tüm ambiyans sendesentezle üretilir (ffmpeg/Node), telifli müzik yok.
 */
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { TIMELINE, FPS, TOTAL_FRAMES } from "../src/timeline";
import { seeded } from "../src/theme";

const FFMPEG = process.env.FFMPEG ?? path.resolve(process.cwd(), "node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg");
const SR = 48000;
/** Kompozisyon süresi (sn) — timeline'dan türetilir. */
const DUR = TOTAL_FRAMES / FPS;

type Wav = { ch: Float32Array[]; rate: number };

function readWav(buf: Buffer): Wav {
  let off = 12;
  let fmt = { ch: 1, rate: 44100, bits: 16, type: 1 };
  let data: Buffer<ArrayBufferLike> = Buffer.alloc(0);
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    const body = buf.subarray(off + 8, off + 8 + size);
    if (id === "fmt ") {
      fmt = {
        type: body.readUInt16LE(0),
        ch: body.readUInt16LE(2),
        rate: body.readUInt32LE(4),
        bits: body.readUInt16LE(14),
      };
    } else if (id === "data") {
      data = body;
    }
    off += 8 + size + (size % 2);
  }
  const bytes = fmt.bits / 8;
  const n = Math.floor(data.length / (bytes * fmt.ch));
  const chs: Float32Array[] = Array.from({ length: fmt.ch }, () => new Float32Array(n));
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < fmt.ch; c++) {
      const p = (i * fmt.ch + c) * bytes;
      let v: number;
      if (fmt.type === 1) {
        v = bytes === 2 ? data.readInt16LE(p) / 32768 : data.readInt32LE(p) / 2147483648;
      } else {
        v = data.readFloatLE(p);
      }
      chs[c][i] = v;
    }
  }
  return { ch: chs, rate: fmt.rate };
}

function writeWav(file: string, ch: Float32Array[], rate: number) {
  const n = ch[0].length;
  const buf = Buffer.alloc(44 + n * ch.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * ch.length * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(ch.length, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * ch.length * 2, 28);
  buf.writeUInt16LE(ch.length * 2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * ch.length * 2, 40);
  let p = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch.length; c++) {
      const v = Math.max(-1, Math.min(1, ch[c][i]));
      buf.writeInt16LE(Math.round(v * 32767), p);
      p += 2;
    }
  }
  fs.writeFileSync(file, buf);
}

/* ---------------- sentez ---------------- */

function white(rnd: () => number, n: number): Float32Array {
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = rnd() * 2 - 1;
  return a;
}

function lowpass(x: Float32Array, alpha: number): Float32Array {
  const y = new Float32Array(x.length);
  let prev = 0;
  for (let i = 0; i < x.length; i++) {
    prev += alpha * (x[i] - prev);
    y[i] = prev;
  }
  return y;
}

function brown(rnd: () => number, n: number): Float32Array {
  const w = white(rnd, n);
  const y = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    prev = (prev + 0.02 * w[i]) / 1.02;
    y[i] = prev * 3.5;
  }
  return y;
}

function normalize(x: Float32Array, peak: number): Float32Array {
  let m = 1e-9;
  for (const v of x) m = Math.max(m, Math.abs(v));
  const g = peak / m;
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = x[i] * g;
  return y;
}

function stereo(mono: Float32Array, pan: (t: number) => number): Float32Array[] {
  const L = new Float32Array(mono.length);
  const R = new Float32Array(mono.length);
  for (let i = 0; i < mono.length; i++) {
    const p = pan(i / SR);
    L[i] = mono[i] * (1 - p) * 0.7071 + mono[i] * 0.2929;
    R[i] = mono[i] * p * 0.7071 + mono[i] * 0.2929;
  }
  return [L, R];
}

/* ---------------- ambiyans---------------- */

function makeWind(): Float32Array {
  const rnd = seeded(1234);
  const n = SR * DUR;
  const src = brown(rnd, n);
  const lp = lowpass(src, 0.06);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const lfo = 0.55 + 0.45 * Math.sin(t * 0.31) * Math.sin(t * 0.117 + 1.2);
    const gust = Math.max(0, Math.sin(t * 0.07 + 0.4)) ** 3;
    out[i] = lp[i] * (0.5 + lfo * 0.7 + gust * 0.5);
  }
  return normalize(out, 0.5);
}

function makeRoom(): Float32Array {
  const rnd = seeded(777);
  const n = SR * DUR;
  const src = brown(rnd, n);
  const lp = lowpass(src, 0.02);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = lp[i] * 1.1 + Math.sin(t * 2 * Math.PI * 48) * 0.012;
  }
  return normalize(out, 0.55);
}

function makePad(): Float32Array {
  const n = SR * DUR;
  const out = new Float32Array(n);
  const freqs = [55, 82.41, 110, 164.81];
  const gains = [0.5, 0.32, 0.2, 0.1];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (let k = 0; k < freqs.length; k++) {
      const det = 1 + 0.0015 * Math.sin(t * 0.09 + k);
      v += gains[k] * Math.sin(t * 2 * Math.PI * freqs[k] * det + k);
    }
    const lfo = 0.7 + 0.3 * Math.sin(t * 0.13 + 0.7);
    out[i] = v * lfo * 0.35;
  }
  return normalize(out, 0.3);
}

function makeWhoosh(): Float32Array {
  const n = Math.floor(SR * 0.5);
  const rnd = seeded(4242);
  const src = white(rnd, n);
  const out = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.sin(Math.PI * t) ** 2;
    const cutoff = 0.02 + 0.25 * Math.sin(Math.PI * t);
    prev += cutoff * (src[i] - prev);
    out[i] = prev * env * 2.2;
  }
  return normalize(out, 0.5);
}

/* ---------------- anlatım ---------------- */

function convert(clip: string): string {
  const out = path.resolve(process.cwd(), "audio/work", `${clip.replace(".wav", "")}_48.wav`);
  if (!fs.existsSync(out)) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const r = spawnSync(
      FFMPEG,
      ["-y", "-hide_banner", "-loglevel", "error", "-i", path.resolve(process.cwd(), "audio", clip), "-ar", String(SR), "-ac", "2", "-c:a", "pcm_s16le", out],
      { stdio: "inherit" }
    );
    if (r.status !== 0) throw new Error(`ffmpeg dönüşümü başarısız: ${clip}`);
  }
  return out;
}

function place(dst: Float32Array[], src: Wav, atSec: number, gain: number, fade = 0.012) {
  const start = Math.round(atSec * SR);
  const n = Math.min(src.ch[0].length, dst[0].length - start);
  if (n <= 0) return;
  const f = Math.max(1, Math.round(fade * SR));
  for (let c = 0; c < dst.length; c++) {
    const s = src.ch[Math.min(c, src.ch.length - 1)];
    for (let i = 0; i < n; i++) {
      let g = gain;
      if (i < f) g *= i / f;
      if (i > n - f) g *= (n - i) / f;
      dst[c][start + i] += s[i] * g;
    }
  }
}

function bedEnvelope(segments: { from: number; to: number; gain: number }[], t: number): number {
  let g = 0;
  for (const s of segments) {
    const a = Math.min(1, Math.max(0, (t - s.from) / 1.2));
    const b = Math.min(1, Math.max(0, (s.to - t) / 1.2));
    g += s.gain * Math.min(a, b);
  }
  return Math.max(0, g);
}

const main = () => {
  const total = SR * DUR;
  const master: Float32Array[] = [new Float32Array(total), new Float32Array(total)];

  // 1) anlatım
  for (const e of TIMELINE) {
    if (!e.audio) continue;
    const file = convert(e.audio);
    const w = readWav(fs.readFileSync(file));
    // klip başına tepe normalizasyonu
    let peak = 1e-9;
    for (const s of w.ch) for (const v of s) peak = Math.max(peak, Math.abs(v));
    const g = 0.62 / peak;
    place(master, w, e.start / FPS, g);
    console.log(`[audio] ${e.audio} @ ${(e.start / FPS).toFixed(2)}s  peak=${peak.toFixed(3)} dur=${(w.ch[0].length / SR).toFixed(2)}s`);
  }

  // 2) ambiyans katmanları
  const wind = makeWind();
  const room = makeRoom();
  const pad = makePad();

  // ambiyans segmentleri: 60 sn'lik tasarımdan orantılı (yüzde tabanlı)
  const pc = (a: number, b: number) => ({ from: (a / 60) * DUR, to: (b / 60) * DUR });
  const windSeg = [
    { ...pc(0, 9.6), gain: 0.35 },
    { ...pc(9.6, 23.8), gain: 0.85 },
    { ...pc(23.8, 43.6), gain: 0.12 },
    { ...pc(43.6, 60), gain: 0.5 },
  ];
  const roomSeg = [{ ...pc(23.6, 43.8), gain: 0.5 }];
  const padSeg = [
    { ...pc(0, 9.6), gain: 0.5 },
    { ...pc(9.6, 23.8), gain: 0.14 },
    { ...pc(23.8, 43.6), gain: 0.1 },
    { ...pc(43.6, 60), gain: 0.45 },
  ];

  const [windL, windR] = stereo(wind, () => 0.5);
  const [roomL, roomR] = stereo(room, () => 0.5);
  const [padL, padR] = stereo(pad, (t) => 0.5 + 0.12 * Math.sin(t * 0.07));

  for (let i = 0; i < total; i++) {
    const t = i / SR;
    const gw = bedEnvelope(windSeg, t);
    const gr = bedEnvelope(roomSeg, t);
    const gp = bedEnvelope(padSeg, t);
    master[0][i] += windL[i] * gw * 0.5 + roomL[i] * gr + padL[i] * gp;
    master[1][i] += windR[i] * gw * 0.5 + roomR[i] * gr + padR[i] * gp;
  }

  // 3) geçiş sesleri (sahne kesimleri)
  const whoosh = makeWhoosh();
  const [wL, wR] = stereo(whoosh, () => 0.5);
  TIMELINE.forEach((e, idx) => {
    if (idx === 0) return;
    const panL = idx % 2 ? 0.32 : 0.68;
    const tmp: Float32Array[] = [new Float32Array(wL.length), new Float32Array(wR.length)];
    for (let i = 0; i < wL.length; i++) {
      tmp[0][i] = wL[i] * panL;
      tmp[1][i] = wR[i] * (1 - panL);
    }
    place(master, { ch: tmp, rate: SR }, e.start / FPS - 0.05, 0.5, 0.02);
  });

  // 4) yumuşak sınırlama + normalizasyon (hedef: yayın standardı ~ -14 dB RMS)
  let peak = 1e-9;
  for (const ch of master) for (const v of ch) peak = Math.max(peak, Math.abs(v));
  const g = 0.99 / peak;
  for (const ch of master) {
    for (let i = 0; i < ch.length; i++) {
      const v = ch[i] * g;
      ch[i] = Math.tanh(v * 1.8) * 0.96;
    }
  }

  const out = path.resolve(process.cwd(), "audio/master.wav");
  writeWav(out, master, SR);
  console.log(`[audio] master -> ${out} (${(fs.statSync(out).size / 1024 / 1024).toFixed(2)} MB)`);
};

main();
