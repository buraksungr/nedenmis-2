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

/**
 * En tepedeki KÜÇÜK etiket — 1-2 kelime.
 * Kullanıcı isteği: büyük yazı olmamalı, sade küçük bir bölüm etiketi.
 */
export const Tag: React.FC<{ text: string; t: number; delay?: number; y?: number; align?: "center" | "left" }> = ({
  text,
  t,
  delay = 0.12,
  y = 92,
  align = "center",
}) => {
  const p = clamp01((t - delay) / 0.45);
  return (
    <div
      style={{
        position: "absolute",
        left: 84,
        right: 84,
        top: y,
        display: "flex",
        alignItems: "center",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: 10,
        opacity: p,
        transform: `translateY(${lerp(-10, 0, easeOutCubic(p))}px)`,
      }}
    >
      <span style={{ width: 18, height: 3, background: C.gold, borderRadius: 2 }} />
      <span
        style={{
          fontFamily: FONT_TEXT,
          fontWeight: 700,
          fontSize: 25,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: C.sand,
          textShadow: "0 2px 6px rgba(29,17,6,0.75)",
        }}
      >
        {text}
      </span>
      <span style={{ width: 18, height: 3, background: C.gold, borderRadius: 2 }} />
    </div>
  );
};

/** Küçük üst etiket (bölüm adı) — eski kullanımlar için. */
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

/**
 * Altyazı — konuşmayla senkronize.
 * Anlatım metni, konuşma süresine karakter oranıyla bölünerek
 * her parça, sesin o andaki konumuna oturur.
 */
export const Subtitle: React.FC<{
  text: string;
  t: number;
  /** Bu sahnedeki sesin toplam süresi (sn) — klip süresi. */
  audioSec: number;
  y?: number;
}> = ({ text, t, audioSec, y = 1656 }) => {
  const chunks = React.useMemo(() => splitCaption(text, audioSec), [text, audioSec]);
  const active = chunks.find((c) => t >= c.start && t < c.start + c.dur) ?? null;

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 72,
        top: y,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {active && (
        <SubtitleLine key={`${active.start}`} text={active.text} local={t - active.start} dur={active.dur} />
      )}
    </div>
  );
};

const SubtitleLine: React.FC<{ text: string; local: number; dur: number }> = ({ text, local, dur }) => {
  const fade = 0.1;
  const pIn = clamp01(local / fade);
  const pOut = clamp01((dur - local) / fade);
  const opacity = Math.min(pIn, pOut);
  return (
    <div
      style={{
        maxWidth: "100%",
        padding: "14px 26px",
        borderRadius: 14,
        background: "rgba(24,14,5,0.78)",
        boxShadow: "0 10px 26px rgba(0,0,0,0.45)",
        fontFamily: FONT_TEXT,
        fontWeight: 600,
        fontSize: 38,
        lineHeight: 1.3,
        letterSpacing: "0.005em",
        textAlign: "center",
        color: C.cream,
        opacity,
        transform: `translateY(${lerp(14, 0, easeOutCubic(pIn))}px)`,
      }}
    >
      {text}
    </div>
  );
};

/** Metni konuşma süresine orantılı, okunabilir parçalara böler. */
export function splitCaption(text: string, audioSec: number): { text: string; start: number; dur: number }[] {
  const words = text.split(/\s+/).filter(Boolean);
  const TARGET = 44;
  const chunks: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > TARGET && cur) {
      chunks.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) chunks.push(cur);

  const totalChars = chunks.reduce((a, c) => a + c.length, 0) || 1;
  const MIN_DUR = 0.85;
  let weights = chunks.map((c) => Math.max(MIN_DUR, (audioSec * c.length) / totalChars));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  weights = weights.map((w) => (w / sum) * audioSec);

  const out: { text: string; start: number; dur: number }[] = [];
  let cursor = 0;
  for (let i = 0; i < chunks.length; i++) {
    out.push({ text: chunks[i], start: cursor, dur: weights[i] });
    cursor += weights[i];
  }
  return out;
}

/** Altta duran kısa açıklama. */
export const Caption: React.FC<{ text: string; t: number; y?: number; delay?: number }> = ({ text, t, y, delay = 0.2 }) => {
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
export const ClosingCard: React.FC<{ t: number; total: number; title: string; sub: string }> = ({ t, total, title, sub }) => {
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
