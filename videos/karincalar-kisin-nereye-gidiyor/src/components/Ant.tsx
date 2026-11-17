import React from "react";
import { C } from "../theme";

export type AntVariant = "worker" | "queen";

export type AntProps = {
  /** Yerel sahne zamanı (sn). */
  t: number;
  x?: number;
  y?: number;
  scale?: number;
  flip?: boolean;
  variant?: AntVariant;
  /** Yürüyüş döngüsü hızı (1 = normal). */
  speed?: number;
  /** Bacak salınım genliği (derece). */
  legAmp?: number;
  /** Gövde rengi. */
  body?: string;
  /** Gölge */
  shadow?: boolean;
  opacity?: number;
};

type Leg = { hip: [number, number]; base: number; phase: number; far?: boolean };

const WORKER_LEGS: Leg[] = [
  { hip: [24, 6], base: 52, phase: 0 },
  { hip: [8, 11], base: 88, phase: Math.PI },
  { hip: [-8, 9], base: 124, phase: 0.6 },
  // uzak taraf (daha koyu, hafif geride)
  { hip: [22, 4], base: 62, phase: Math.PI * 0.9, far: true },
  { hip: [6, 9], base: 96, phase: 0.2, far: true },
  { hip: [-10, 7], base: 132, phase: Math.PI * 1.3, far: true },
];

function polar(len: number, deg: number): [number, number] {
  const r = (deg * Math.PI) / 180;
  return [len * Math.cos(r), len * Math.sin(r)];
}

/**
 * Anatomik olarak tanınabilir, yana bakan 2B karınca.
 * Üç gövde parçası (baş, göğüs, karın), dirsekli anten, altı bacak.
 */
export const Ant: React.FC<AntProps> = ({
  t,
  x = 0,
  y = 0,
  scale = 1,
  flip = false,
  variant = "worker",
  speed = 1,
  legAmp = 12,
  body,
  shadow = true,
  opacity = 1,
}) => {
  const queen = variant === "queen";
  const fill = body ?? (queen ? C.soilDark : C.antBody);
  const hi = C.antHi;
  const freq = 2.1 * speed;
  const w = t * freq * Math.PI * 2;

  const bob = Math.sin(w) * (queen ? 0.8 : 1.7) * Math.min(1, speed);
  const sway = Math.sin(w * 0.5) * 1.2;

  const gasterRx = queen ? 46 : 40;
  const gasterRy = queen ? 32 : 28;
  const thoraxRx = queen ? 27 : 22;
  const thoraxRy = queen ? 21 : 18;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        opacity,
        transform: `scale(${flip ? -scale : scale}, ${scale})`,
      }}
    >
      <svg
        width={320 * scale}
        height={220 * scale}
        viewBox="-160 -110 320 220"
        style={{ position: "absolute", left: -160 * scale, top: -110 * scale, overflow: "visible" }}
      >
        {shadow && (
          <ellipse
            cx={2}
            cy={58}
            rx={queen ? 62 : 54}
            ry={10}
            fill="#1d1106"
            opacity={0.22}
            transform={`translate(0 ${bob * 0.4})`}
          />
        )}
        <g transform={`translate(0 ${bob}) rotate(${sway * 0.4})`}>
          {/* uzak bacaklar */}
          {WORKER_LEGS.filter((l) => l.far).map((l, i) => (
            <LegShape key={`f${i}`} leg={l} t={t} freq={freq} amp={legAmp} color="#241505" w={5} />
          ))}

          {/* karın (gaster) */}
          <ellipse
            cx={-52}
            cy={0}
            rx={gasterRx}
            ry={gasterRy}
            fill={`url(#antG)`}
            stroke={C.ink}
            strokeWidth={6}
            transform="rotate(-9 -52 0)"
          />
          <ellipse
            cx={-58}
            cy={-9}
            rx={gasterRx * 0.55}
            ry={gasterRy * 0.45}
            fill={hi}
            opacity={0.35}
            transform="rotate(-9 -58 -9)"
          />
          {/* segment çizgileri */}
          <path
            d={`M ${-52 + gasterRx * 0.55} ${-gasterRy * 0.75} Q ${-52 + gasterRx * 0.2} 0 ${-52 + gasterRx * 0.55} ${gasterRy * 0.75}`}
            stroke={C.ink}
            strokeWidth={2.4}
            fill="none"
            opacity={0.5}
          />

          {/* petiole (bel boğumu) */}
          <ellipse cx={-14} cy={-2} rx={8} ry={11} fill={fill} stroke={C.ink} strokeWidth={5} />
          <circle cx={-14} cy={-9} r={4.5} fill={fill} stroke={C.ink} strokeWidth={4} />

          {/* göğüs (thorax) */}
          <ellipse
            cx={8}
            cy={-4}
            rx={thoraxRx}
            ry={thoraxRy}
            fill={`url(#antT)`}
            stroke={C.ink}
            strokeWidth={6}
            transform="rotate(-14 8 -4)"
          />
          {queen && (
            <>
              {/* kanat izleri */}
              <path
                d="M -2 -16 Q 12 -26 26 -14"
                stroke={C.ink}
                strokeWidth={3}
                fill="none"
                opacity={0.65}
              />
              <path
                d="M -4 -8 Q 10 -18 24 -7"
                stroke={C.ink}
                strokeWidth={3}
                fill="none"
                opacity={0.5}
              />
            </>
          )}

          {/* yakın bacaklar */}
          {WORKER_LEGS.filter((l) => !l.far).map((l, i) => (
            <LegShape key={`n${i}`} leg={l} t={t} freq={freq} amp={legAmp} color={C.ink} w={6} />
          ))}

          {/* baş */}
          <ellipse cx={40} cy={-8} rx={20} ry={17} fill={`url(#antH)`} stroke={C.ink} strokeWidth={6} />
          {/* çeneling (mandible) */}
          <path
            d="M 55 -10 Q 70 -8 72 4 Q 63 2 55 3"
            fill={C.inkDeep}
            stroke={C.ink}
            strokeWidth={3.5}
            strokeLinejoin="round"
          />
          {/* göz */}
          <ellipse cx={46} cy={-12} rx={4.6} ry={5.2} fill="#120a04" />
          <circle cx={47.6} cy={-14} r={1.5} fill="#f4ecd6" opacity={0.85} />

          {/* dirsekli anten */}
          <g transform={`rotate(${Math.sin(w * 0.7) * 7} 34 -22)`}>
            <path
              d="M 34 -22 C 28 -34 20 -40 12 -44"
              stroke={C.ink}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 12 -44 C 18 -52 26 -58 34 -62"
              stroke={C.ink}
              strokeWidth={4.2}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};

const LegShape: React.FC<{
  leg: Leg;
  t: number;
  freq: number;
  amp: number;
  color: string;
  w: number;
}> = ({ leg, t, freq, amp, color, w }) => {
  const ph = t * freq * Math.PI * 2 + leg.phase;
  const a1 = leg.base + Math.sin(ph) * amp;
  const a2 = a1 + 26 + Math.sin(ph + 0.7) * (amp * 0.7);
  const [kx, ky] = polar(27, a1);
  const [fx, fy] = polar(31, a2);
  const [hx, hy] = leg.hip;
  const knee: [number, number] = [hx + kx, hy + ky];
  const foot: [number, number] = [knee[0] + fx, knee[1] + fy];
  return (
    <path
      d={`M ${hx} ${hy} L ${knee[0].toFixed(1)} ${knee[1].toFixed(1)} L ${foot[0].toFixed(1)} ${foot[1].toFixed(1)}`}
      stroke={color}
      strokeWidth={w}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

/** Karınca için paylaşılan gradyan tanımları. */
export const AntDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <linearGradient id="antG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.antHi} />
        <stop offset="45%" stopColor={C.antMid} />
        <stop offset="100%" stopColor={C.inkDeep} />
      </linearGradient>
      <linearGradient id="antT" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.antHi} />
        <stop offset="100%" stopColor={C.antBody} />
      </linearGradient>
      <linearGradient id="antH" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.antHi} />
        <stop offset="100%" stopColor={C.antBody} />
      </linearGradient>
    </defs>
  </svg>
);
