import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require_ = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));

function exists(p?: string): p is string {
  return Boolean(p && fs.existsSync(p));
}

function resourcesDir(): string {
  return process.env.NEDENMIS_RESOURCES ?? (process as unknown as { resourcesPath?: string }).resourcesPath ?? "";
}

export function findFfmpeg(): string {
  if (exists(process.env.NEDENMIS_FFMPEG)) return process.env.NEDENMIS_FFMPEG as string;
  for (const p of [path.join(resourcesDir(), "bin", "ffmpeg.exe"), path.join(resourcesDir(), "bin", "ffmpeg")]) if (exists(p)) return p;
  try {
    const p = (require_("@ffmpeg-installer/ffmpeg") as { path: string }).path;
    if (exists(p)) return p;
  } catch {
    /* yok */
  }
  for (const p of ["/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg"]) if (exists(p)) return p;
  return "ffmpeg";
}

export function findFfprobe(): string {
  if (exists(process.env.NEDENMIS_FFPROBE)) return process.env.NEDENMIS_FFPROBE as string;
  for (const p of [path.join(resourcesDir(), "bin", "ffprobe.exe"), path.join(resourcesDir(), "bin", "ffprobe")]) if (exists(p)) return p;
  try {
    const p = (require_("@ffprobe-installer/ffprobe") as { path: string }).path;
    if (exists(p)) return p;
  } catch {
    /* yok */
  }
  for (const p of ["/usr/bin/ffprobe", "/usr/local/bin/ffprobe"]) if (exists(p)) return p;
  return "ffprobe";
}

/** Font dizini: paketlenmiş uygulamada resources/fonts, geliştirmede assets/fonts. */
export function findFonts(): { regular?: string; bold?: string } {
  const candidates = [
    process.env.NEDENMIS_FONT_DIR,
    path.join(process.cwd(), "assets", "fonts"),
    path.resolve(here, "../../../../assets/fonts"),
    path.resolve(here, "../../../../../assets/fonts"),
    path.join(resourcesDir(), "fonts"),
    path.join(resourcesDir(), "assets", "fonts"),
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    const regular = path.join(dir, "DejaVuSans.ttf");
    const bold = path.join(dir, "DejaVuSans-Bold.ttf");
    if (exists(regular)) return { regular, bold: exists(bold) ? bold : undefined };
  }
  return {};
}

export function resolveDataDir(): string {
  const dir = process.env.NEDENMIS_DATA_DIR ?? path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function ensureDir(p: string): string {
  fs.mkdirSync(p, { recursive: true });
  return p;
}
