import { estimateSpeechSeconds, type Scene } from "../visual/spec.js";

export type SubtitleChunk = {
  text: string;
  start: number;
  end: number;
  /** true: süre karakter ağırlığına göre tahmin edildi (kelime hizalaması yok). */
  estimated: boolean;
};

export type TimedScene = Scene & {
  startSec: number;
  durationSec: number;
  speechStart: number;
  speechDurationSec: number;
  chunks: SubtitleChunk[];
  audioPath?: string;
  measured: boolean;
};

export type Timeline = {
  scenes: TimedScene[];
  durationSec: number;
  fps: number;
  frames: number;
  targetDurationSec: number;
  withinTolerance: boolean;
  warnings: string[];
  subtitleTiming: "phrase-estimated" | "word-aligned";
  transitionSec: number;
};

export class DurationError extends Error {
  details: string;
  constructor(message: string, details: string) {
    super(message);
    this.name = "DurationError";
    this.details = details;
  }
}

const MIN_GAP = 0.3;
const LEAD_IN = 0.28;
const TAIL = 0.34;
const FADE = 0.3;

/** Anlatımı altyazı parçalarına böler (cümle/ifade düzeyinde). */
export function splitSubtitles(text: string, maxChars = 34): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const groups: string[] = [];
  let cur: string[] = [];
  let len = 0;
  const push = () => {
    if (cur.length) groups.push(cur.join(" "));
    cur = [];
    len = 0;
  };
  for (const w of words) {
    if (cur.length && len + 1 + w.length > maxChars) push();
    cur.push(w);
    len += (len ? 1 : 0) + w.length;
    if (/[.?!]$/.test(w) || (/[,;:]$/.test(w) && len > maxChars * 0.6)) push();
  }
  push();
  return groups.length ? groups : [text];
}

/** Karakter ağırlığına göre ifade zamanlaması — kelime hizalaması DEĞİLDİR. */
export function buildChunks(text: string, speechStart: number, speechDuration: number): SubtitleChunk[] {
  const groups = splitSubtitles(text);
  const weights = groups.map((g) => g.length + (/[.?!]$/.test(g) ? 6 : /,$/.test(g) ? 3 : 0));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  return groups.map((g, i) => {
    const start = speechStart + (acc / total) * speechDuration;
    acc += weights[i];
    return { text: g, start, end: speechStart + (acc / total) * speechDuration, estimated: true };
  });
}

export type TimelineOptions = {
  targetDurationSec: number;
  fps?: number;
  /** Ölçülmüş ses süreleri (sahne id → sn). */
  speechDurations?: Record<string, number>;
  audioPaths?: Record<string, string>;
  /** Sahne başına en fazla ne kadar sessiz bekleme eklenebilir. */
  maxHoldPerScene?: number;
  allowShort?: boolean;
};

export function buildTimeline(scenes: Scene[], opts: TimelineOptions): Timeline {
  const fps = opts.fps ?? 30;
  const target = opts.targetDurationSec;
  const warnings: string[] = [];
  const maxHold = opts.maxHoldPerScene ?? 2.4;

  const measured = scenes.map((s) => {
    const m = opts.speechDurations?.[s.id];
    return { scene: s, speech: m ?? estimateSpeechSeconds(s.narration), measured: m !== undefined };
  });

  let durations = measured.map(({ scene, speech }) => Math.max(scene.minDuration, speech + MIN_GAP + LEAD_IN + TAIL));
  let total = durations.reduce((a, b) => a + b, 0);
  const lower = target * 0.95;
  const upper = target * 1.05;

  // Hedefin altındaysa: her sahneye dengeli bekleme ekle (sahne germe değil, nefes payı).
  if (total < lower) {
    let deficit = target - total;
    let guard = 0;
    while (deficit > 0.01 && guard++ < 60) {
      const active = durations.map((d, i) => (d - measured[i].speech < maxHold ? i : -1)).filter((i) => i >= 0);
      if (!active.length) break;
      const share = Math.min(deficit / active.length, 0.12);
      for (const i of active) durations[i] += share;
      total += share * active.length;
      deficit -= share * active.length;
    }
    if (total < lower) warnings.push(`Hedef süreye ulaşılamadı: ${total.toFixed(2)} sn (hedef ${target} sn).`);
  }

  // Hedefin üstündeyse: önce boşlukları kıs, sonra açık hata ver (sessiz kesme yok).
  if (total > upper) {
    const slack = durations.map((d, i) => Math.max(0, d - (measured[i].speech + LEAD_IN + TAIL + 0.05)));
    const excess = total - target;
    const slackTotal = slack.reduce((a, b) => a + b, 0);
    if (slackTotal > 0) {
      const cut = Math.min(1, excess / slackTotal);
      durations = durations.map((d, i) => d - slack[i] * cut);
      total = durations.reduce((a, b) => a + b, 0);
    }
    if (total > upper) {
      throw new DurationError(
        `Anlatım seçilen süreye sığmıyor (${total.toFixed(1)} sn > hedef ${target} sn).`,
        "Konuşma metni kısaltılmalı veya süre artırılmalı. Nedenmiş Studio anlatımı sessizce kesmez.",
      );
    }
  }

  // Kareye hizala: süre = kare / fps (A/V kaymasını önler).
  const frames = Math.max(1, Math.round(total * fps));
  const durationSec = frames / fps;

  const timed: TimedScene[] = [];
  let cursor = 0;
  measured.forEach(({ scene, speech, measured: isMeasured }, i) => {
    const dur = durations[i];
    const speechStart = cursor + LEAD_IN;
    const chunks = buildChunks(scene.narration, speechStart, speech);
    timed.push({
      ...scene,
      startSec: cursor,
      durationSec: dur,
      speechStart,
      speechDurationSec: speech,
      chunks,
      audioPath: opts.audioPaths?.[scene.id],
      measured: isMeasured,
    });
    cursor += dur;
  });

  const withinTolerance = Math.abs(durationSec - target) <= target * 0.05 + 1 / fps;
  if (!withinTolerance) warnings.push(`Süre toleransı aşıldı: ${durationSec.toFixed(2)} sn (hedef ${target} sn, ±%5).`);

  return {
    scenes: timed,
    durationSec,
    fps,
    frames,
    targetDurationSec: target,
    withinTolerance,
    warnings,
    subtitleTiming: "phrase-estimated",
    transitionSec: FADE,
  };
}

export function sceneIndexAt(timeline: Timeline, t: number): number {
  const { scenes } = timeline;
  for (let i = scenes.length - 1; i >= 0; i--) {
    if (t >= scenes[i].startSec) return i;
  }
  return 0;
}

export function subtitleAt(timeline: Timeline, t: number): { text: string; sceneIndex: number; chunkIndex: number } | null {
  for (let i = 0; i < timeline.scenes.length; i++) {
    const s = timeline.scenes[i];
    const idx = s.chunks.findIndex((c) => t >= c.start && t < c.end + 0.03);
    if (idx >= 0) return { text: s.chunks[idx].text, sceneIndex: i, chunkIndex: idx };
  }
  return null;
}
