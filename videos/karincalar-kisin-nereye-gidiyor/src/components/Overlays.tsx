import React from "react";
import { clamp01 } from "../theme";

/** Kağıt/tuval greni — referans görseldeki dokulu yüzey hissi. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.1 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage: "url('/public/grain.png')",
      backgroundRepeat: "repeat",
      backgroundSize: "340px 340px",
      opacity,
      mixBlendMode: "overlay",
      pointerEvents: "none",
    }}
  />
);

export const Vignette: React.FC<{ opacity?: number }> = ({ opacity = 0.55 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage: "url('/public/vignette.png')",
      backgroundSize: "cover",
      opacity,
      pointerEvents: "none",
    }}
  />
);

/** Sıcak/soğuk renk süzdürme. */
export const Grade: React.FC<{ color: string; opacity: number; blend?: "overlay" | "multiply" | "soft-light" }> = ({
  color,
  opacity,
  blend = "overlay",
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: color,
      opacity,
      mixBlendMode: blend,
      pointerEvents: "none",
    }}
  />
);

/** Sahne girişinde kısa baj (geçiş efekti). */
export const Flash: React.FC<{ t: number; at?: number; dur?: number; color?: string }> = ({
  t,
  at = 0,
  dur = 0.4,
  color = "#f7f9f6",
}) => {
  const p = clamp01((t - at) / dur);
  const opacity = p < 0.5 ? p * 2 : (1 - p) * 2;
  return (
    <div style={{ position: "absolute", inset: 0, background: color, opacity: opacity * 0.9, pointerEvents: "none" }} />
  );
};

/** Yumuşak sıcak ışıma. */
export const Glow: React.FC<{ x: number; y: number; size: number; opacity: number }> = ({
  x,
  y,
  size,
  opacity,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      backgroundImage: "url('/public/glow.png')",
      backgroundSize: "contain",
      opacity,
      mixBlendMode: "screen",
      pointerEvents: "none",
    }}
  />
);

/** Sahnenin ortasına hafif çember çizgisi (derinlik hissi). */
export const DepthRings: React.FC<{ cx: number; cy: number; t: number; color?: string }> = ({
  cx,
  cy,
  t,
  color = "rgba(244,236,214,0.25)",
}) => (
  <>
    {[0, 1, 2].map((i) => {
      const p = (t * 0.35 + i / 3) % 1;
      const r = 120 + p * 780;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: cx - r,
            top: cy - r,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            border: `3px solid ${color}`,
            opacity: (1 - p) * 0.5,
          }}
        />
      );
    })}
  </>
);
