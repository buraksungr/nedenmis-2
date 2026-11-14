import { Resvg } from "@resvg/resvg-js";
import { findFonts } from "./tools.js";

export type RasterOptions = { width?: number; height?: number };

let fontOpts: { fontFiles: string[] } | null = null;

function fonts(): { fontFiles: string[] } {
  if (fontOpts) return fontOpts;
  const { regular, bold } = findFonts();
  const files = [regular, bold].filter(Boolean) as string[];
  fontOpts = { fontFiles: files };
  return fontOpts;
}

/** SVG karesini PNG'ye çevirir (CPU, deterministik). */
export function svgToPng(svg: string, opts: RasterOptions = {}): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: opts.width ? { mode: "width", value: opts.width } : { mode: "original" },
    font: { loadSystemFonts: true, ...fonts() },
    background: "#05080f",
  });
  return Buffer.from(resvg.render().asPng());
}

export function svgToRawRgba(svg: string, width = 1080, height = 1920): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { loadSystemFonts: true, ...fonts() },
  });
  const img = resvg.render();
  return Buffer.from(img.asPng());
}
