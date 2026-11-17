import React from "react";
import { interpolate } from "remotion";
import { C, clamp01, lerp, easeOutCubic, seeded } from "../theme";
import { Ant, AntDefs } from "../components/Ant";
import { Sky, Ground, Thermometer, GrassTuft } from "../components/Environment";
import { Tag, Subtitle } from "../components/Text";
import { Camera, SceneShell } from "../components/Camera";
import { Snow, FallingLeaves } from "../components/Snow";
import { SoilCutaway } from "../components/Nest";
import { Grade, Flash, Glow } from "../components/Overlays";

export type SceneProps = {
  t: number;
  duration: number;
  narration?: string;
  audioSec?: number;
  topLabel?: string;
};

/** Altyazı + üst etiket — tüm sahnelerde ortak. */
const Overlay: React.FC<SceneProps> = ({ t, duration, narration, audioSec, topLabel }) => (
  <>
    {topLabel && <Tag text={topLabel} t={t} y={92} />}
    {narration && audioSec ? <Subtitle text={narration} t={t} audioSec={audioSec} y={1652} /> : null}
  </>
);

/** Yuva ağzı — toprakta koyu çukur. */
export const NestMouth: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x - 90 * scale,
      top: y - 26 * scale,
      width: 180 * scale,
      height: 52 * scale,
      borderRadius: "50%",
      background: "radial-gradient(ellipse at 50% 32%, #150c03 0%, #2b1a0c 55%, #3a2410 100%)",
      border: "5px solid rgba(29,17,6,0.55)",
    }}
  />
);

/* ------------------------------------------------------------------ */
/* 1) HOOK — yazın her yerinde karınca                                */
/* ------------------------------------------------------------------ */
export const S1Hook: React.FC<SceneProps> = (p) => {
  const { t, duration } = p;
  const zoom = interpolate(t, [0, duration], [1, 1.06]);
  const panY = interpolate(t, [0, duration], [0, -22]);
  return (
    <SceneShell>
      <Camera scale={zoom} y={panY}>
        <Sky season="summer" t={t} height={1180} />
        <Ground season="summer" t={t} y={1150} />
        {/* uzak karınca yolu */}
        {[0, 1, 2, 3].map((i) => {
          const rnd = seeded(11 + i);
          const x0 = 60 + rnd() * 700;
          return (
            <Ant
              key={i}
              t={t + i * 0.3}
              x={x0 + t * 34}
              y={1082 + rnd() * 46}
              scale={0.62 + rnd() * 0.3}
              speed={1.5}
              body={C.antMid}
            />
          );
        })}
        {/* ana karınca: orta plan, yiyecek taşıyor (ekranın alt kenarına kırpılmadan) */}
        <Ant t={t} x={300} y={1078} scale={1.85} speed={1.0} />
        <div
          style={{
            position: "absolute",
            left: 300 + 58 * 1.85 + 40,
            top: 1078 - 10,
            width: 62,
            height: 50,
            borderRadius: "46% 54% 52% 48%",
            background: "radial-gradient(circle at 35% 30%, #c8b06a, #6b4423)",
            border: "4px solid #2b1a0c",
            transform: `translateY(${Math.sin(t * 2.1 * Math.PI * 2) * 2}px)`,
          }}
        />
        {/* ön plan çimleri (derinlik) */}
        {[0, 1, 2, 3].map((i) => {
          const rnd = seeded(31 + i);
          return (
            <GrassTuft
              key={i}
              x={rnd() * 1080}
              y={1780 + rnd() * 120}
              scale={2.6 + rnd() * 1.6}
              color={i % 2 ? "#3a2410" : "#4a2c14"}
              t={t}
              phase={i * 1.3}
              blades={4 + (i % 3)}
            />
          );
        })}
        {/* çerçeveleyici yaprak */}
        <div
          style={{
            position: "absolute",
            left: -80,
            top: -60,
            width: 520,
            height: 320,
            borderRadius: "0 0 70% 0",
            background: "linear-gradient(135deg,#8a6230,#4a2c14)",
            border: "7px solid #2b1a0c",
            transform: "rotate(-14deg)",
            opacity: 0.95,
          }}
        />
      </Camera>
      <Grade color="#d8c858" opacity={0.13} />
      <Overlay {...p} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 2) KABOL — mevsim değişir, karıncalar yuvanın yanına akıyor       */
/* ------------------------------------------------------------------ */
export const S2Kabol: React.FC<SceneProps> = (p) => {
  const { t, duration } = p;
  const season = clamp01((t - 0.4) / 2.0);
  const snow = clamp01((t - 1.2) / 1.2);
  return (
    <SceneShell>
      <Flash t={t} at={0} dur={0.5} color="#f7f9f6" />
      <Camera scale={interpolate(t, [0, duration], [1.02, 1.09])}>
        <Sky season="summer" t={t} height={1180} />
        <Ground season="summer" t={t} y={1150} />
        <div style={{ position: "absolute", inset: 0, opacity: season }}>
          <Sky season="winter" t={t} height={1180} />
          <Ground season="winter" t={t} y={1150} />
        </div>
        <NestMouth x={540} y={1150} />
        {/* yuva koşan karıncalar */}
        {[0, 1, 2, 3, 4].map((i) => {
          const rnd = seeded(51 + i);
          const x0 = 90 + rnd() * 880;
          const y0 = 1030 + rnd() * 90;
          const pr = clamp01((t - i * 0.12) / 2.4);
          const x = lerp(x0, 540, pr * pr);
          const y = lerp(y0, 1132, pr);
          return (
            <Ant
              key={i}
              t={t * (1 + i * 0.08)}
              x={x}
              y={y}
              scale={0.72 + rnd() * 0.3}
              speed={2.2}
              opacity={1 - Math.pow(pr, 3)}
            />
          );
        })}
        <FallingLeaves t={t} count={18} />
        <Snow t={t} count={80} opacity={snow} speed={0.8} />
      </Camera>
      <Grade color="#bcd6e2" opacity={season * 0.22} />
      <Overlay {...p} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 3) YAVAŞLIYOR — kış yüzeyinde tek karınca yavaşlıyor              */
/* ------------------------------------------------------------------ */
export const S3Yavasliyor: React.FC<SceneProps> = (p) => {
  const { t, duration } = p;
  const level = interpolate(t, [0, duration], [0.78, 0.14]);
  const pan = interpolate(t, [0, duration], [40, -40]);
  const speed = interpolate(t, [0, duration], [1.5, 0.1]);
  const legAmp = interpolate(t, [0, duration], [13, 2.5]);
  const frost = clamp01((t - 2.0) / 4.0);
  return (
    <SceneShell>
      <Camera x={pan} scale={interpolate(t, [0, duration], [1, 1.05])}>
        <Sky season="winter" t={t} height={1180} />
        <Ground season="winter" t={t} y={1150} />
        {/* tek karınca, giderek hareketsizleşiyor — ekranın orta-altında */}
        <Ant t={t} x={430} y={1090} scale={1.55} speed={speed} legAmp={legAmp} />
        {/* arkada bıraktığı iz */}
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 280 - i * 24,
              top: 1146 + (i % 2) * 4,
              width: 11,
              height: 6,
              borderRadius: "50%",
              background: "rgba(120,140,150,0.32)",
            }}
          />
        ))}
        {/* donma çizgileri */}
        {Array.from({ length: 4 }).map((_, i) => {
          const a = (i / 4) * Math.PI * 2 + 0.4;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 430 + Math.cos(a) * 150 - 20,
                top: 1090 + Math.sin(a) * 118 - 20,
                width: 40,
                height: 40,
                borderLeft: "2.5px solid rgba(233,243,243,0.8)",
                borderTop: "2.5px solid rgba(233,243,243,0.8)",
                transform: `rotate(${a}rad)`,
                opacity: frost * 0.8,
              }}
            />
          );
        })}
        <Thermometer x={850} y={600} level={level} t={t} label={`${Math.round(level * 30 - 20)}°C`} />
      </Camera>
      <Snow t={t} count={90} opacity={0.85} />
      <Grade color="#bcd6e2" opacity={0.18 + frost * 0.1} />
      <Overlay {...p} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 4) DERİN YUVA — kamera toprağın altına iniyor                      */
/* ------------------------------------------------------------------ */
export const S4Derinyuva: React.FC<SceneProps> = (p) => {
  const { t, duration } = p;
  const pr = easeOutCubic(clamp01(t / 3.4));
  return (
    <SceneShell>
      <Flash t={t} at={0} dur={0.45} color="#1d1106" />
      <Camera scale={interpolate(t, [0, duration], [1, 1.12])}>
        <SoilCutaway t={t} warmth={0.25} />
        {/* yüzey dünyası yukarı kayıp kaybolur */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1920, transform: `translateY(${-pr * 1920}px)` }}>
          <Sky season="winter" t={t} height={1180} />
          <Ground season="winter" t={t} y={1150} />
        </div>
        {/* tünele inen karıncalar */}
        {[0, 1, 2, 3, 4].map((i) => {
          const q = clamp01((t - 0.35 - i * 0.3) / 3.0);
          const y = lerp(170, 880 + (i % 3) * 110, easeOutCubic(q));
          const x = 540 + Math.sin(q * 5 + i) * 22;
          return <Ant key={i} t={t} x={x} y={y} scale={0.95 + (i % 2) * 0.2} speed={1.3} opacity={q > 0.02 ? 1 : 0} />;
        })}
        <Glow x={540} y={1250} size={900} opacity={0.25 + pr * 0.3} />
      </Camera>
      <Grade color="#a88838" opacity={pr * 0.12} />
      <Overlay {...p} />
      <AntDefs />
    </SceneShell>
  );
};
