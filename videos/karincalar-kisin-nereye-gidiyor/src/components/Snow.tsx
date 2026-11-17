import React from "react";
import { seeded } from "../theme";

export const Snow: React.FC<{
  t: number;
  count?: number;
  /** alan: üstten alta doğru kare sayısı (1920 varsayılan). */
  height?: number;
  width?: number;
  speed?: number;
  size?: [number, number];
  opacity?: number;
  wind?: number;
  seed?: number;
}> = ({
  t,
  count = 70,
  height = 1920,
  width = 1080,
  speed = 1,
  size = [4, 11],
  opacity = 0.9,
  wind = 40,
  seed = 7,
}) => {
  const rnd = seeded(seed);
  const flakes = Array.from({ length: count }, () => ({
    x: rnd() * width,
    y0: rnd() * height,
    s: size[0] + rnd() * (size[1] - size[0]),
    v: 0.5 + rnd() * 0.9,
    ph: rnd() * Math.PI * 2,
    drift: 0.4 + rnd() * 1.2,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity, pointerEvents: "none" }}>
      {flakes.map((f, i) => {
        const y = (f.y0 + t * 110 * f.v * speed) % (height + 40) - 20;
        const x = (f.x + Math.sin(t * f.drift + f.ph) * wind + t * wind * 0.15) % (width + 40);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - 20,
              top: y,
              width: f.s,
              height: f.s,
              borderRadius: "50%",
              background: "#f7f9f6",
              opacity: 0.55 + 0.45 * f.v,
            }}
          />
        );
      })}
    </div>
  );
};

/** Yaprakların rüzgârla süzülmesi (yaz geçişi). */
export const FallingLeaves: React.FC<{ t: number; count?: number; seed?: number }> = ({
  t,
  count = 16,
  seed = 21,
}) => {
  const rnd = seeded(seed);
  const leaves = Array.from({ length: count }, () => ({
    x: rnd() * 1080,
    y0: rnd() * 1920,
    s: 14 + rnd() * 22,
    v: 0.4 + rnd() * 0.8,
    ph: rnd() * Math.PI * 2,
    rot: rnd() * 360,
    color: rnd() > 0.5 ? "#a88838" : "#8a6230",
  }));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {leaves.map((l, i) => {
        const y = (l.y0 + t * 90 * l.v) % 2000 - 40;
        const x = l.x + Math.sin(t * 1.1 + l.ph) * 90;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: l.s,
              height: l.s * 0.6,
              background: l.color,
              borderRadius: "60% 40% 60% 40%",
              transform: `rotate(${l.rot + t * 90}deg)`,
              opacity: 0.85,
            }}
          />
        );
      })}
    </div>
  );
};
