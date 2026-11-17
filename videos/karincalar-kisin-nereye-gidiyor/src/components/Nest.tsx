import React from "react";
import { C, mixHex, seeded } from "../theme";

export type Chamber = { x: number; y: number; rx: number; ry: number };

/** Yer altı kesiti: toprak katmanları, tüneller, odacıklar. */
export const SoilCutaway: React.FC<{
  t: number;
  warmth: number; // 0 = soğuk/kış, 1 = sıcak/ilkbahar
  chambers?: Chamber[];
  showTunnels?: boolean;
  seed?: number;
}> = ({ t, warmth, chambers, showTunnels = true, seed = 5 }) => {
  const w = clamp(warmth);
  const top = mixHex("#6a5a48", "#8a6230", w);
  const mid = mixHex("#584a3e", "#6b4423", w);
  const deep = mixHex("#453b34", "#40260f", w);
  const line = mixHex("#3a322c", "#2b1a0c", w);

  const list = chambers ?? [
    { x: 540, y: 900, rx: 190, ry: 120 },
    { x: 300, y: 1300, rx: 210, ry: 130 },
    { x: 780, y: 1660, rx: 230, ry: 140 },
  ];

  const rnd = seeded(seed);
  const pebbles = Array.from({ length: 46 }, () => ({
    x: rnd() * 1080,
    y: 200 + rnd() * 1680,
    rx: 6 + rnd() * 22,
    ry: 4 + rnd() * 14,
    o: 0.12 + rnd() * 0.25,
  }));

  const wave = (y: number, amp: number, ph: number) => {
    let d = `M 0 1920 L 0 ${y}`;
    for (let x = 0; x <= 1080; x += 60) {
      const yy = y + Math.sin((x / 1080) * Math.PI * 2 + ph) * amp;
      d += ` L ${x} ${yy.toFixed(1)}`;
    }
    d += " L 1080 1920 Z";
    return d;
  };

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <rect width={1080} height={1920} fill={deep} />
      <path d={wave(430, 26, 0.4)} fill={mid} opacity={0.95} />
      <path d={wave(880, 34, 1.7)} fill={top} opacity={0.55} />
      <path d={wave(1350, 30, 3.1)} fill={mid} opacity={0.35} />

      {/* kökler */}
      {Array.from({ length: 12 }).map((_, i) => {
        const rnd2 = seeded(seed * 7 + i);
        const x = rnd2() * 1080;
        const len = 140 + rnd2() * 320;
        return (
          <path
            key={`r${i}`}
            d={`M ${x} 0 Q ${x + (rnd2() - 0.5) * 90} ${len * 0.5} ${x + (rnd2() - 0.5) * 140} ${len}`}
            stroke={line}
            strokeWidth={3 + rnd2() * 4}
            fill="none"
            opacity={0.35}
          />
        );
      })}

      {/* çakıl taşları */}
      {pebbles.map((p, i) => (
        <ellipse key={`p${i}`} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill={line} opacity={p.o} />
      ))}

      {/* tüneller */}
      {showTunnels && (
        <>
          <path
            d="M 540 -20 C 520 240 560 420 540 620 C 528 760 540 800 540 900"
            stroke={C.inkDeep}
            strokeWidth={54}
            fill="none"
            strokeLinecap="round"
            opacity={0.9}
          />
          <path
            d="M 540 900 C 470 1020 360 1120 300 1300"
            stroke={C.inkDeep}
            strokeWidth={46}
            fill="none"
            strokeLinecap="round"
            opacity={0.9}
          />
          <path
            d="M 540 900 C 660 1080 740 1300 780 1660"
            stroke={C.inkDeep}
            strokeWidth={46}
            fill="none"
            strokeLinecap="round"
            opacity={0.9}
          />
        </>
      )}

      {/* odacıklar */}
      {list.map((ch, i) => {
        const glow = Math.max(0, (ch.y - 700) / 1200) * w;
        return (
          <g key={`c${i}`}>
            <ellipse
              cx={ch.x}
              cy={ch.y}
              rx={ch.rx}
              ry={ch.ry}
              fill={mixHex("#2a1c10", "#5a3410", glow)}
              stroke={line}
              strokeWidth={7}
            />
            <ellipse
              cx={ch.x}
              cy={ch.y}
              rx={ch.rx - 12}
              ry={ch.ry - 10}
              fill="none"
              stroke={mixHex("#4a3f38", "#a88838", glow)}
              strokeWidth={3}
              opacity={0.5 + glow * 0.4}
            />
          </g>
        );
      })}

      {/* derinlik ısı ortamı */}
      <rect
        width={1080}
        height={520}
        y={1400}
        fill="url(#heat)"
        opacity={0.25 + w * 0.5}
        style={{ mixBlendMode: "screen" }}
      />
      <defs>
        <linearGradient id="heat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffcf7a" stopOpacity={0} />
          <stop offset="100%" stopColor="#ff9d4d" stopOpacity={0.9} />
        </linearGradient>
      </defs>
    </svg>
  );
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** Kraliçe odacığı: sıcak ışık, yumurtalar, işçiler. */
export const QueenChamber: React.FC<{ t: number; warmth: number }> = ({ t, warmth }) => {
  const rnd = seeded(99);
  const eggs = Array.from({ length: 12 }, () => ({
    x: (rnd() - 0.5) * 260,
    y: (rnd() - 0.5) * 120,
    rx: 14 + rnd() * 10,
    ry: 9 + rnd() * 7,
    rot: rnd() * 90,
  }));
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {eggs.map((e, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 + e.x,
            top: 1660 + e.y + 40,
            width: e.rx * 2,
            height: e.ry * 2,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #f7f0dc, #d8c8a0)",
            border: "2px solid rgba(43,26,12,0.5)",
            transform: `rotate(${e.rot}deg)`,
            opacity: 0.55 + warmth * 0.4,
          }}
        />
      ))}
    </div>
  );
};
