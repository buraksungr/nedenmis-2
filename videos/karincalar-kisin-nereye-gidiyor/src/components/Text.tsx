import React from "react";
import { C, FONT_DISPLAY, FONT_TEXT, clamp01, easeOutBack, easeOutCubic, lerp } from "../theme";

export type WordAnim = {
  /** toplam sahne süresi (sn) */
  total: number;
  /** görünüme başlama (sn) */
  delay?: number;
  /** görünüm süresi (sn) */
  inDur?: number;
  /** kayboluş süresi (sn) */
  outDur?: number;
};

/**
 * Büyük ekranda duran, motion-graphics tarzı kelime.
 * Çift yönlü: içerik şeridi kayarak gelir, altından altın çizgi uzar.
 */
export const BigWord: React.FC<{
  text: string;
  t: number;
  total: number;
  y?: number;
  size?: number;
  delay?: number;
  inDur?: number;
  outDur?: number;
  color?: string;
  chip?: boolean;
  align?: "center" | "left";
}> = ({
  text,
  t,
  total,
  y = 0,
  size = 96,
  delay = 0.15,
  inDur = 0.5,
  outDur = 0.4,
  color = C.cream,
  chip = true,
  align = "center",
}) => {
  const pIn = clamp01((t - delay) / inDur);
  const outStart = total - outDur;
  const pOut = t > outStart ? clamp01((t - outStart) / outDur) : 0;

  // Mobilde taşmayı önle: karakter sayısına göre otomatik küçült.
  const fit = Math.min(1, 1500 / (text.length * size));
  const fontSize = Math.round(size * fit * 100) / 100;

  const slide = lerp(-120, 0, easeOutCubic(pIn));
  const scale = lerp(0.86, 1, easeOutBack(pIn));
  const opacity = pIn * (1 - easeOutCubic(pOut));
  const exitY = easeOutCubic(pOut) * -26;

  const line = clamp01((t - delay - 0.12) / 0.5) * (1 - pOut);

  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        right: 96,
        top: y,
        display: "flex",
        justifyContent: align === "center" ? "center" : "flex-start",
        opacity,
        transform: `translateX(${slide}%) translateY(${exitY}px) scale(${scale})`,
        transformOrigin: align === "center" ? "center center" : "left center",
      }}
    >
      <div style={{ position: "relative", maxWidth: "100%" }}>
        {chip && (
          <div
            style={{
              position: "absolute",
              inset: "-14px -22px",
              background: C.ink,
              borderRadius: 10,
              transform: "skewX(-7deg)",
              boxShadow: "0 14px 30px rgba(29,17,6,0.35)",
            }}
          />
        )}
        <div
          style={{
            position: "relative",
          fontFamily: FONT_DISPLAY,
          fontWeight: 400,
          fontSize,
            lineHeight: 1.02,
            letterSpacing: "-0.015em",
            color,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            transform: chip ? "skewX(0deg)" : undefined,
          }}
        >
          {text}
        </div>
        <div
          style={{
            marginTop: 10,
            height: 6,
            width: `${line * 100}%`,
            background: C.gold,
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  );
};

/** Küçük üst etiket (bölüm adı). */
export const Kicker: React.FC<{ text: string; t: number; delay?: number; y?: number }> = ({
  text,
  t,
  delay = 0.05,
  y = 0,
}) => {
  const p = clamp01((t - delay) / 0.5);
  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        top: y,
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: p,
        transform: `translateY(${lerp(-14, 0, easeOutCubic(p))}px)`,
      }}
    >
      <span style={{ width: 26, height: 4, background: C.gold, borderRadius: 2 }} />
      <span
        style={{
          fontFamily: FONT_TEXT,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: C.ink,
        }}
      >
        {text}
      </span>
    </div>
  );
};

/** Altta duran kısa açıklama. */
export const Caption: React.FC<{ text: string; t: number; y?: number; delay?: number }> = ({
  text,
  t,
  y,
  delay = 0.2,
}) => {
  const p = clamp01((t - delay) / 0.5);
  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        right: 100,
        top: y,
        fontFamily: FONT_TEXT,
        fontWeight: 600,
        fontSize: 34,
        lineHeight: 1.3,
        color: C.ink,
        opacity: p,
        transform: `translateY(${lerp(16, 0, easeOutCubic(p))}px)`,
      }}
    >
      {text}
    </div>
  );
};

/** Kapanış tipografi kartı. */
export const ClosingCard: React.FC<{ t: number; total: number; title: string; sub: string }> = ({
  t,
  total,
  title,
  sub,
}) => {
  const p = clamp01(t / 0.6);
  const p2 = clamp01((t - 0.35) / 0.6);
  const pOut = t > total - 0.35 ? clamp01((t - (total - 0.35)) / 0.35) : 0;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        opacity: p * (1 - pOut),
        transform: `scale(${lerp(0.94, 1, easeOutBack(p))})`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 150,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: C.cream,
          textTransform: "uppercase",
          textShadow: "0 10px 0 rgba(29,17,6,0.55), 0 22px 44px rgba(29,17,6,0.5)",
          transform: `translateY(${lerp(40, 0, easeOutCubic(p))}px)`,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: FONT_TEXT,
          fontWeight: 600,
          fontSize: 46,
          color: C.sand,
          opacity: p2,
          transform: `translateY(${lerp(24, 0, easeOutCubic(p2))}px)`,
        }}
      >
        {sub}
      </div>
      <div
        style={{
          width: 120,
          height: 6,
          background: C.gold,
          borderRadius: 3,
          opacity: p2,
          transform: `scaleX(${p2})`,
        }}
      />
    </div>
  );
};
