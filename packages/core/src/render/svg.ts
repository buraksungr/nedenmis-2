import { H, W, clamp, easeOut, esc, n, paletteFor, seg, wrapText, type Palette } from "../visual/primitives.js";
import { getComponent } from "../visual/components/index.js";
import { getCard } from "../ontology/resolve.js";
import type { KnowledgeCard } from "../ontology/types.js";
import { sceneIndexAt, subtitleAt, type Timeline, type TimedScene } from "./timeline.js";

const CARD_CACHE = new Map<string, KnowledgeCard>();

function cardForScene(scene: TimedScene): KnowledgeCard | undefined {
  const id = scene.id.split("-s")[0];
  if (!CARD_CACHE.has(id)) {
    const c = getCard(id);
    if (c) CARD_CACHE.set(id, c);
  }
  return CARD_CACHE.get(id);
}

function cameraTransform(scene: TimedScene, t: number): string {
  const p = clamp(t / Math.max(0.01, scene.durationSec));
  const e = easeOut(p);
  const mode = scene.spec.camera;
  let scale = 1;
  let dx = 0;
  if (mode === "zoom_in") scale = 1 + 0.07 * e;
  if (mode === "zoom_out") scale = 1.075 - 0.07 * e;
  if (mode === "pan_left") dx = -34 * e;
  if (mode === "pan_right") dx = 34 * (1 - e);
  if (scale === 1 && dx === 0) return "";
  return `translate(${n(540 + dx)} ${n(900)}) scale(${n(scale)}) translate(-540 -900)`;
}

function background(pal: Palette, seed: number): string {
  let stars = "";
  for (let i = 0; i < 18; i++) {
    const x = ((seed * 37 + i * 151) % 1013) + 30;
    const y = ((seed * 71 + i * 233) % 1500) + 240;
    const r = 1 + ((i * 7) % 3) * 0.7;
    stars += `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="#ffffff" opacity="${0.035 + (i % 4) * 0.012}"/>`;
  }
  return `
    <defs>
      <linearGradient id="bgMain" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="${pal.bg0}"/>
        <stop offset="0.55" stop-color="${pal.bg1}"/>
        <stop offset="1" stop-color="${pal.bg0}"/>
      </linearGradient>
      <radialGradient id="bgGlow" cx="0.5" cy="0.42" r="0.62">
        <stop offset="0" stop-color="${pal.accent}" stop-opacity="0.16"/>
        <stop offset="1" stop-color="${pal.accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bgMain)"/>
    <rect width="${W}" height="${H}" fill="url(#bgGlow)"/>
    ${stars}
  `;
}

function overlayTitle(text: string, lt: number, dur: number, pal: Palette): string {
  if (!text) return "";
  const inner = esc(text.toLocaleUpperCase("tr"));
  const inP = easeOut(seg(lt, 0.25, 0.85));
  const outP = 1 - seg(lt, Math.min(dur - 0.4, 4.6), Math.min(dur - 0.05, 5.1));
  const a = clamp(inP * outP);
  if (a <= 0.01) return "";
  const size = text.length > 36 ? 38 : text.length > 24 ? 44 : text.length > 16 ? 52 : 60;
  const maxChars = Math.max(12, Math.floor(880 / (size * 0.6)));
  const lines = wrapText(inner, maxChars).slice(0, 2);
  const lineH = size * 1.16;
  const y = 300 + (1 - inP) * 20;
  const width = Math.max(...lines.map((l) => l.length)) * size * 0.6 + 70;
  const boxH = lines.length * lineH + size * 0.5;
  let out = `<g opacity="${n(a)}">
    <rect x="${n(540 - width / 2)}" y="${n(y - size * 0.95)}" width="${n(Math.min(940, width))}" height="${n(boxH)}" rx="24" fill="rgba(4,8,14,0.5)" stroke="rgba(255,255,255,0.08)"/>`;
  lines.forEach((line, i) => {
    out += `<text x="540" y="${n(y + i * lineH)}" font-size="${size}" font-weight="700" text-anchor="middle" fill="#ffffff" letter-spacing="0.5">${line}</text>`;
  });
  out += `<rect x="${n(540 - Math.min(940, width) * 0.14)}" y="${n(y + (lines.length - 1) * lineH + 18)}" width="${n(Math.min(940, width) * 0.28)}" height="6" rx="3" fill="${pal.accent2}"/></g>`;
  return out;
}

function highlightWords(text: string, keywords: string[], pal: Palette, size: number, x: number, y: number): string {
  const lower = (s: string) => s.toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}]/gu, "");
  const keys = keywords.map(lower).filter((k) => k.length >= 4);
  const words = text.split(" ");
  const spans = words.map((w) => {
    const bare = lower(w);
    const hit = keys.some((k) => bare.startsWith(k.slice(0, Math.max(4, k.length - 2))) && bare.length >= 3);
    return hit ? `<tspan fill="${pal.accent2}">${esc(w)}</tspan>` : `<tspan fill="#ffffff">${esc(w)}</tspan>`;
  });
  return `<text x="${n(x)}" y="${n(y)}" font-size="${size}" font-weight="700" text-anchor="middle" xml:space="preserve">${spans.join(" ")}</text>`;
}

function subtitle(text: string, keywords: string[], pal: Palette): string {
  const lines = wrapText(text, 30).slice(0, 3);
  const size = lines.length > 2 ? 46 : 52;
  const lineH = size * 1.22;
  const y = 1640 - (lines.length - 1) * lineH;
  const maxLen = Math.max(...lines.map((l) => l.length));
  const boxW = Math.min(980, maxLen * size * 0.56 + 72);
  const boxH = lines.length * lineH + 34;
  let out = `<rect x="${n(540 - boxW / 2)}" y="${n(y - size - 6)}" width="${n(boxW)}" height="${n(boxH)}" rx="26" fill="rgba(3,7,12,0.62)" stroke="rgba(255,255,255,0.08)"/>`;
  lines.forEach((line, i) => {
    out += highlightWords(line, keywords, pal, size, 540, y + i * lineH);
  });
  return out;
}

export type FrameOptions = {
  showSubtitles?: boolean;
  showOverlay?: boolean;
  showBrand?: boolean;
  quality?: "preview" | "final";
};

/** Tek bir kareyi SVG olarak üretir. t → SVG saf fonksiyondur (deterministik). */
export function renderFrameSvg(timeline: Timeline, time: number, opts: FrameOptions = {}): string {
  const t = clamp(time, 0, Math.max(0, timeline.durationSec - 1e-6));
  const idx = sceneIndexAt(timeline, t);
  const scene = timeline.scenes[idx];
  const card = cardForScene(scene);
  const pal = paletteFor(scene.domain);
  const lt = t - scene.startSec;
  const component = getComponent(scene.spec.componentId);

  const body = component
    ? component.render({ t: lt, dur: scene.durationSec, params: scene.spec.params, pal, card: card! })
    : `<text x="540" y="900" font-size="40" fill="#ff6b6b" text-anchor="middle">Bileşen yok</text>`;

  const edge = 0.26;
  const fadeIn = idx === 0 ? 1 : easeOut(seg(lt, 0, edge));
  const fadeOut = idx === timeline.scenes.length - 1 ? 1 : 1 - seg(lt + edge, scene.durationSec - edge, scene.durationSec);
  const sceneAlpha = clamp(Math.min(fadeIn, fadeOut));

  const sub = opts.showSubtitles === false ? null : subtitleAt(timeline, t);
  const keywords = scene.conceptIds.flatMap((id) => {
    const c = card?.concepts.includes(id) ? id : "";
    void c;
    return [];
  });
  const kw = scene.conceptLabels;
  void keywords;

  const progress = clamp(t / timeline.durationSec);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="DejaVu Sans">
  <defs>
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="26"/></filter>
    <filter id="soft2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="10"/></filter>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.14"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient>
  </defs>
  ${background(pal, idx + 1)}
  <g opacity="${n(sceneAlpha)}">
    ${cameraTransform(scene, lt) ? `<g transform="${cameraTransform(scene, lt)}">${body}</g>` : body}
  </g>
  <rect x="0" y="1330" width="${W}" height="590" fill="url(#shade)"/>
  ${opts.showBrand === false ? "" : `<text x="540" y="132" font-size="26" font-weight="700" letter-spacing="10" text-anchor="middle" fill="#ffffff" opacity="0.42">NEDENMİŞ</text>`}
  ${opts.showOverlay === false ? "" : overlayTitle(scene.overlay, lt, scene.durationSec, pal)}
  ${sub && opts.showSubtitles !== false ? subtitle(sub.text, kw, pal) : ""}
  <rect x="0" y="0" width="${W}" height="6" fill="#0b1622"/>
  <rect x="0" y="0" width="${n(W * progress)}" height="6" fill="${pal.accent}" opacity="0.8"/>
</svg>`;
}

/** Storyboard/UI önizlemesi için sahne ortasından kare. */
export function renderScenePreviewSvg(timeline: Timeline, sceneIndex: number): string {
  const scene = timeline.scenes[sceneIndex];
  const t = scene.startSec + Math.min(scene.durationSec * 0.55, 6);
  return renderFrameSvg(timeline, t, { showSubtitles: false });
}
