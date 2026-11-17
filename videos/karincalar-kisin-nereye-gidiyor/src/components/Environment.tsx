import React from "react";
import { C, seeded } from "../theme";

export type Season = "summer" | "winter" | "spring";

export const Sky: React.FC<{ season: Season; t: number; y?: number; height?: number }> = ({
  season,
  t,
  y = 0,
  height = 1200,
}) => {
  const grad =
    season === "summer"
      ? "linear-gradient(180deg,#b9d8de 0%,#cfe3e6 42%,#efe7cd 100%)"
      : season === "spring"
      ? "linear-gradient(180deg,#b6d6dd 0%,#d3e8e4 48%,#eef0d8 100%)"
      : "linear-gradient(180deg,#a9c2cc 0%,#c3d5db 48%,#e6edee 100%)";
  const sunOp = season === "winter" ? 0.35 : 0.9;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, height, background: grad }}>
      {/* güneş */}
      <div
        style={{
          position: "absolute",
          left: season === "winter" ? 720 : 780,
          top: 190,
          width: 190,
          height: 190,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${season === "winter" ? "#f2f4f2" : "#ffe9a8"} 0%, ${
            season === "winter" ? "rgba(242,244,242,0)" : "rgba(255,220,120,0)"
          } 68%)`,
          opacity: sunOp,
        }}
      />
      {/* bulutlar */}
      {season !== "winter" &&
        [0, 1, 2].map((i) => {
          const speed = 6 + i * 3;
          const cx = ((t * speed + i * 420) % 1500) - 200;
          const cy = 180 + i * 150;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: cx,
                top: cy,
                width: 300,
                height: 92,
                borderRadius: 999,
                background: "rgba(247,249,246,0.85)",
                filter: "blur(2px)",
                boxShadow: "60px 22px 0 10px rgba(247,249,246,0.7), -70px 26px 0 4px rgba(247,249,246,0.6)",
              }}
            />
          );
        })}
      {season === "winter" &&
        [0, 1].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: ((t * 5 + i * 600) % 1600) - 250,
              top: 150 + i * 190,
              width: 420,
              height: 100,
              borderRadius: 999,
              background: "rgba(226,236,240,0.6)",
              filter: "blur(6px)",
            }}
          />
        ))}
    </div>
  );
};

/** Çimen / ot tuftı: rüzgârla salınır. */
export const GrassTuft: React.FC<{
  x: number;
  y: number;
  scale?: number;
  color?: string;
  t: number;
  phase?: number;
  blades?: number;
}> = ({ x, y, scale = 1, color = C.sage, t, phase = 0, blades = 5 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0 }}>
    <svg width={120 * scale} height={140 * scale} viewBox="-60 -140 120 140" style={{ overflow: "visible" }}>
      {Array.from({ length: blades }).map((_, i) => {
        const spread = (i - (blades - 1) / 2) * 16;
        const h = 70 + ((i * 37) % 50);
        const sway = Math.sin(t * 1.3 + phase + i * 0.5) * 9;
        return (
          <path
            key={i}
            d={`M 0 0 Q ${spread * 0.4} ${-h * 0.6} ${spread + sway} ${-h}`}
            stroke={color}
            strokeWidth={7 * scale}
            fill="none"
            strokeLinecap="round"
            opacity={0.95}
          />
        );
      })}
    </svg>
  </div>
);

/** Yüzey toprağı (yaz / kış / ilkbahar). */
export const Ground: React.FC<{ season: Season; t: number; y?: number; height?: number }> = ({
  season,
  t,
  y = 1150,
  height = 770,
}) => {
  const bg =
    season === "summer"
      ? "linear-gradient(180deg,#a88838 0%,#8a6230 34%,#6b4423 72%,#4a2c14 100%)"
      : season === "spring"
      ? "linear-gradient(180deg,#9a7a34 0%,#7d5a28 38%,#5f3d1c 76%,#40260f 100%)"
      : "linear-gradient(180deg,#eef3f4 0%,#dde7ea 26%,#c9d6dc 55%,#a9bcc6 100%)";
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, height, background: bg }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 26,
          background: season === "winter" ? "rgba(247,249,246,0.95)" : "rgba(232,220,160,0.5)",
        }}
      />
      {/* toprak dokusu: yatay çentikler */}
      {season !== "winter" &&
        Array.from({ length: 9 }).map((_, i) => {
          const yy = 60 + i * 78;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: yy,
                height: 12,
                background: i % 2 ? "rgba(29,17,6,0.10)" : "rgba(244,236,214,0.07)",
                filter: "blur(1px)",
              }}
            />
          );
        })}
      {/* çimenler */}
      {season === "summer" &&
        Array.from({ length: 7 }).map((_, i) => {
          const rnd = seeded(100 + i);
          return (
            <GrassTuft
              key={i}
              x={rnd() * 1000}
              y={-6}
              scale={0.8 + rnd() * 1.5}
              color={i % 2 ? C.sage : C.gold}
              t={t}
              phase={i}
              blades={4 + (i % 3)}
            />
          );
        })}
      {season === "spring" &&
        Array.from({ length: 9 }).map((_, i) => {
          const rnd = seeded(300 + i);
          return (
            <GrassTuft
              key={i}
              x={rnd() * 1010}
              y={40 + rnd() * 120}
              scale={0.5 + rnd() * 0.8}
              color={i % 2 ? C.sage : "#b3c47a"}
              t={t}
              phase={i * 1.7}
              blades={3 + (i % 3)}
            />
          );
        })}
      {/* kış: kup / çıkıntılar */}
      {season === "winter" &&
        Array.from({ length: 6 }).map((_, i) => {
          const rnd = seeded(500 + i);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: rnd() * 1000,
                top: 30 + rnd() * 120,
                width: 120 + rnd() * 160,
                height: 26 + rnd() * 20,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.75)",
              }}
            />
          );
        })}
    </div>
  );
};

/** Termometre: sıcaklık göstergesi. */
export const Thermometer: React.FC<{
  x: number;
  y: number;
  level: number; // 0..1
  t: number;
  scale?: number;
  label?: string;
}> = ({ x, y, level, t, scale = 1, label }) => {
  const h = 300 * scale;
  const w = 44 * scale;
  const mercury = Math.max(0.04, Math.min(1, level));
  const col = level > 0.55 ? "#d8543a" : level > 0.3 ? "#d8c858" : "#7fb2c9";
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w + 60 * scale, height: h + 90 * scale }}>
      <svg width={w + 60 * scale} height={h + 90 * scale} viewBox={`0 0 ${w + 60 * scale} ${h + 90 * scale}`}>
        <rect x={w / 2 - 12 * scale} y={10} width={24 * scale} height={h} rx={12 * scale} fill="#f4ecd6" opacity={0.92} stroke={C.ink} strokeWidth={5 * scale} />
        <rect
          x={w / 2 - 7 * scale}
          y={10 + h * (1 - mercury)}
          width={14 * scale}
          height={h * mercury}
          rx={7 * scale}
          fill={col}
        />
        <circle cx={w / 2} cy={h + 24 * scale} r={26 * scale} fill={col} stroke={C.ink} strokeWidth={5 * scale} />
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={i}
            x1={w / 2 + 14 * scale}
            y1={20 + (h - 20) * (i / 5)}
            x2={w / 2 + 26 * scale}
            y2={20 + (h - 20) * (i / 5)}
            stroke={C.ink}
            strokeWidth={3 * scale}
            opacity={0.6}
          />
        ))}
      </svg>
      {label && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: h + 60 * scale,
            textAlign: "center",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: 26 * scale,
            color: C.cream,
            textShadow: "0 2px 0 rgba(29,17,6,0.7)",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};
