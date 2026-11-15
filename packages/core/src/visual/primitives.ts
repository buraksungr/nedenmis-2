/** Deterministik SVG yardımcıları. Rastgelelik yoktur; her kare t'nin saf fonksiyonudur. */

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export type Palette = {
  bg0: string;
  bg1: string;
  accent: string;
  accent2: string;
  accent3: string;
  ink: string;
  muted: string;
};

export const PALETTES: Record<string, Palette> = {
  physics: { bg0: "#061019", bg1: "#0b2030", accent: "#5ad2ff", accent2: "#ffd166", accent3: "#9d8cff", ink: "#eaf6ff", muted: "#8fb4c9" },
  chemistry: { bg0: "#140d06", bg1: "#2a1b0c", accent: "#ffb84d", accent2: "#6fe3c4", accent3: "#ff8fa3", ink: "#fff3e2", muted: "#c9a882" },
  materials: { bg0: "#0a0f1a", bg1: "#16202f", accent: "#8fe3ff", accent2: "#ffd166", accent3: "#b8a6ff", ink: "#eef7ff", muted: "#93a9bd" },
  biology: { bg0: "#04120d", bg1: "#0b2419", accent: "#6ee7a8", accent2: "#ffd166", accent3: "#7fd1ff", ink: "#eafff3", muted: "#8fb8a3" },
  geology: { bg0: "#120b06", bg1: "#241505", accent: "#ffa451", accent2: "#ffd166", accent3: "#9be3c1", ink: "#fff0e0", muted: "#c4a184" },
  astronomy: { bg0: "#04060f", bg1: "#0d1128", accent: "#8f9dff", accent2: "#ffd166", accent3: "#ff9ecb", ink: "#eef0ff", muted: "#8f97c4" },
  earth: { bg0: "#04121a", bg1: "#082633", accent: "#5fd4e8", accent2: "#ffd166", accent3: "#a9e6a0", ink: "#e9fbff", muted: "#8db7c4" },
  environment: { bg0: "#04140e", bg1: "#0a2a1c", accent: "#7fe3a8", accent2: "#ffd166", accent3: "#7fd1ff", ink: "#eafff2", muted: "#8fb8a1" },
  mathematics: { bg0: "#0b0b14", bg1: "#171a2c", accent: "#b6a4ff", accent2: "#ffd166", accent3: "#7fe3d0", ink: "#f0eeff", muted: "#9c9dc6" },
  engineering: { bg0: "#0a1014", bg1: "#152229", accent: "#7fd8e8", accent2: "#ffd166", accent3: "#ff9d7a", ink: "#eef8fb", muted: "#94aab3" },
  technology: { bg0: "#080d18", bg1: "#111a2e", accent: "#74c8ff", accent2: "#ffd166", accent3: "#c99cff", ink: "#eef5ff", muted: "#96a5c0" },
};

export function paletteFor(domain: string): Palette {
  return PALETTES[domain] ?? PALETTES.physics;
}

export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const n = (v: number) => Math.round(v * 100) / 100;
export const seg = (t: number, a: number, b: number) => clamp((t - a) / Math.max(1e-6, b - a));

export const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
export const easeIn = (p: number) => p * p * p;
export const smooth = (p: number) => p * p * (3 - 2 * p);

/** 0..1 döngüsel nabız. */
export const pulse = (t: number, period = 1.6) => 0.5 + 0.5 * Math.sin((t / period) * Math.PI * 2);

/** Deterministik sözde-rastgele (frame bazlı, tekrarlanabilir). */
export function rand(seed: number, i: number): number {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Türkçe metni yaklaşık genişlikle satırlara böler. */
export function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export type LabelOpts = {
  size?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
  opacity?: number;
  letterSpacing?: number;
  shadow?: boolean;
  italic?: boolean;
};

export function label(x: number, y: number, text: string, o: LabelOpts = {}): string {
  const size = o.size ?? 34;
  const fill = o.fill ?? "#ffffff";
  const anchor = o.anchor ?? "middle";
  const weight = o.weight ?? 600;
  const opacity = o.opacity ?? 1;
  const ls = o.letterSpacing ?? 0;
  const shadow = o.shadow === false ? "" : `<text x="${n(x + 2)}" y="${n(y + 3)}" font-size="${n(size)}" font-weight="${weight}" text-anchor="${anchor}" fill="#000" opacity="${n(opacity * 0.45)}" letter-spacing="${ls}">${esc(text)}</text>`;
  return `${shadow}<text x="${n(x)}" y="${n(y)}" font-size="${n(size)}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}" opacity="${n(opacity)}" letter-spacing="${ls}"${o.italic ? ' font-style="italic"' : ""}>${esc(text)}</text>`;
}

export function chip(x: number, y: number, text: string, opts: { fill?: string; color?: string; size?: number; padX?: number; padY?: number; opacity?: number; stroke?: string } = {}): string {
  const size = opts.size ?? 30;
  const padX = opts.padX ?? 22;
  const padY = opts.padY ?? 14;
  const w = text.length * size * 0.56 + padX * 2;
  const h = size + padY * 2;
  const fill = opts.fill ?? "rgba(8,14,24,0.72)";
  const color = opts.color ?? "#ffffff";
  return `<rect x="${n(x - w / 2)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(h / 2)}" fill="${fill}"${opts.stroke ? ` stroke="${opts.stroke}" stroke-width="1.5"` : ""} opacity="${opts.opacity ?? 1}"/>${label(x, y + size * 0.34, text, { size, fill: color })}`;
}

export function arrow(x1: number, y1: number, x2: number, y2: number, opts: { color?: string; width?: number; dash?: string; head?: number; opacity?: number } = {}): string {
  const color = opts.color ?? "#ffffff";
  const width = opts.width ?? 3;
  const head = opts.head ?? 12;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hx = x2 - head * Math.cos(ang) * 0.9;
  const hy = y2 - head * Math.sin(ang) * 0.9;
  const p1x = hx + head * 0.55 * Math.cos(ang + Math.PI / 2);
  const p1y = hy + head * 0.55 * Math.sin(ang + Math.PI / 2);
  const p2x = hx + head * 0.55 * Math.cos(ang - Math.PI / 2);
  const p2y = hy + head * 0.55 * Math.sin(ang - Math.PI / 2);
  return `<g opacity="${opts.opacity ?? 1}"><line x1="${n(x1)}" y1="${n(y1)}" x2="${n(hx)}" y2="${n(hy)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${opts.dash ? ` stroke-dasharray="${opts.dash}"` : ""}/><polygon points="${n(x2)},${n(y2)} ${n(p1x)},${n(p1y)} ${n(p2x)},${n(p2y)}" fill="${color}"/></g>`;
}

export function circle(cx: number, cy: number, r: number, opts: { fill?: string; stroke?: string; strokeWidth?: number; opacity?: number; dash?: string } = {}): string {
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${opts.fill ?? "none"}"${opts.stroke ? ` stroke="${opts.stroke}" stroke-width="${opts.strokeWidth ?? 2}"` : ""}${opts.dash ? ` stroke-dasharray="${opts.dash}"` : ""} opacity="${opts.opacity ?? 1}"/>`;
}

export function panel(x: number, y: number, w: number, h: number, opts: { fill?: string; stroke?: string; rx?: number; opacity?: number; strokeWidth?: number } = {}): string {
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${opts.rx ?? 28}" fill="${opts.fill ?? "rgba(255,255,255,0.04)"}"${opts.stroke ? ` stroke="${opts.stroke}" stroke-width="${opts.strokeWidth ?? 1.5}"` : ""} opacity="${opts.opacity ?? 1}"/>`;
}

export function glow(cx: number, cy: number, r: number, color: string, opacity = 0.5): string {
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${color}" opacity="${n(opacity)}" filter="url(#soft)"/>`;
}

export function dot(cx: number, cy: number, r: number, fill: string, opacity = 1): string {
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}" opacity="${n(opacity)}"/>`;
}

/** Perspektifli 3B nokta projeksiyonu (sahne renderer'ları için). */
export function project3D(x: number, y: number, z: number, cx: number, cy: number, scale = 1, tilt = 0.55): { x: number; y: number; depth: number } {
  const depth = 1 / (1.35 + z * 0.42);
  return {
    x: cx + (x - z * 0.35) * scale * depth,
    y: cy + (y * tilt - z * 0.42) * scale * depth,
    depth,
  };
}

export const SVG_DEFS = `
  <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="26"/></filter>
  <filter id="soft2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="10"/></filter>
  <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
  <linearGradient id="fadeBottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient>
`;
