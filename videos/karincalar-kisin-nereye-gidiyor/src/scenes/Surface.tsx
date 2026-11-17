import React from "react";
import { interpolate } from "remotion";
import { C, clamp01, lerp, easeOutCubic, seeded } from "../theme";
import { Ant, AntDefs } from "../components/Ant";
import { Sky, Ground, Thermometer, GrassTuft } from "../components/Environment";
import { BigWord, Kicker, ClosingCard } from "../components/Text";
import { Camera, SceneShell } from "../components/Camera";
import { Snow, FallingLeaves } from "../components/Snow";
import { Grade, Flash, Glow } from "../components/Overlays";

export type SceneProps = { t: number; duration: number };

/* ------------------------------------------------------------------ */
/* 1) HOOK — yazın her yerinde karınca                                */
/* ------------------------------------------------------------------ */
export const S1Hook: React.FC<SceneProps> = ({ t, duration }) => {
  const zoom = interpolate(t, [0, duration], [1, 1.07]);
  const panY = interpolate(t, [0, duration], [0, -34]);
  return (
    <SceneShell>
      <Camera scale={zoom} y={panY}>
        <Sky season="summer" t={t} height={1180} />
        <Ground season="summer" t={t} y={1150} />
        {/* uzak karınca yolu */}
        {[0, 1, 2].map((i) => {
          const rnd = seeded(11 + i);
          const x0 = 120 + rnd() * 700;
          return (
            <Ant
              key={i}
              t={t + i * 0.3}
              x={x0 + t * 26}
              y={1080 + rnd() * 60}
              scale={0.7 + rnd() * 0.4}
              speed={1.4}
              body={C.antMid}
            />
          );
        })}
        {/* ana karınca: yakın plan, yiyecek taşıyor */}
        <Ant t={t} x={150} y={1330} scale={2.5} speed={1.1} />
        {/* taşınan yemek parçası */}
        <div
          style={{
            position: "absolute",
            left: 150 + 168 * 2.5 * 0.55,
            top: 1330 - 10,
            width: 74,
            height: 60,
            borderRadius: "46% 54% 52% 48%",
            background: "radial-gradient(circle at 35% 30%, #c8b06a, #6b4423)",
            border: "5px solid #2b1a0c",
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
            border: "8px solid #2b1a0c",
            transform: "rotate(-14deg)",
            opacity: 0.95,
          }}
        />
      </Camera>
      <Grade color="#d8c858" opacity={0.13} />
      <Kicker text="Bir kış belgeseli" t={t} y={120} />
      <BigWord text="Her Yerdesiniz" t={t} total={duration} y={190} size={104} delay={0.25} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 2) MERAK — mevsim değişir, karıncalar kaybolur                     */
/* ------------------------------------------------------------------ */
export const S2Merak: React.FC<SceneProps> = ({ t, duration }) => {
  const season = clamp01((t - 0.35) / 2.0);
  const snow = clamp01((t - 1.1) / 1.2);
  return (
    <SceneShell>
      <Flash t={t} at={0} dur={0.5} color="#f7f9f6" />
      <Camera scale={interpolate(t, [0, duration], [1.02, 1.1])}>
        <Sky season="summer" t={t} height={1180} />
        <Ground season="summer" t={t} y={1150} />
        <div style={{ position: "absolute", inset: 0, opacity: season }}>
          <Sky season="winter" t={t} height={1180} />
          <Ground season="winter" t={t} y={1150} />
        </div>
        {/* yuva girişi */}
        <div
          style={{
            position: "absolute",
            left: 540 - 90,
            top: 1168,
            width: 180,
            height: 62,
            borderRadius: "50%",
            background: "radial-gradient(ellipse at 50% 30%, #1d1106, #3a2410)",
            border: "6px solid rgba(29,17,6,0.6)",
          }}
        />
        {/* yuva koşan karıncalar */}
        {[0, 1, 2, 3, 4].map((i) => {
          const rnd = seeded(51 + i);
          const x0 = 120 + rnd() * 850;
          const y0 = 1020 + rnd() * 130;
          const p = clamp01((t - i * 0.12) / 2.3);
          const x = lerp(x0, 540, p * p);
          const y = lerp(y0, 1185, p);
          return (
            <Ant
              key={i}
              t={t * (1 + i * 0.08)}
              x={x}
              y={y}
              scale={0.8 + rnd() * 0.5}
              speed={2.2}
              opacity={1 - Math.pow(p, 3)}
            />
          );
        })}
        <FallingLeaves t={t} count={18} />
        <Snow t={t} count={80} opacity={snow} speed={0.8} />
      </Camera>
      <Grade color="#bcd6e2" opacity={season * 0.22} />
      <BigWord text="Kiş Geldi!" t={t} total={duration} y={210} size={116} delay={0.5} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 3) SOĞUK KANLI — yüzeyde tek karınca, sıcaklık düşüyor            */
/* ------------------------------------------------------------------ */
export const S3ColdBlooded: React.FC<SceneProps> = ({ t, duration }) => {
  const level = interpolate(t, [0, duration], [0.78, 0.16]);
  const pan = interpolate(t, [0, duration], [50, -50]);
  return (
    <SceneShell>
      <Camera x={pan} scale={interpolate(t, [0, duration], [1, 1.06])}>
        <Sky season="winter" t={t} height={1180} />
        <Ground season="winter" t={t} y={1150} />
        {/* tek karınca, neredeyse hareketsiz */}
        <Ant t={t} x={420} y={1320} scale={1.5} speed={0.18} legAmp={3} />
        {/* iz bırakıyor */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 250 - i * 26,
              top: 1385 + (i % 2) * 5,
              width: 12,
              height: 7,
              borderRadius: "50%",
              background: "rgba(120,140,150,0.35)",
            }}
          />
        ))}
        <Thermometer x={840} y={620} level={level} t={t} label={`${Math.round(level * 30 - 20)}°C`} />
      </Camera>
      <Snow t={t} count={90} opacity={0.85} />
      <Grade color="#bcd6e2" opacity={0.2} />
      <Kicker text="Bilimsel açıklama" t={t} y={120} />
      <BigWord text="Soğuk Kanlı" t={t} total={duration} y={190} size={104} delay={0.2} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 4) METABOLİZMA — makro karınca yavaşlıyor                          */
/* ------------------------------------------------------------------ */
export const S4Metabolism: React.FC<SceneProps> = ({ t, duration }) => {
  const speed = interpolate(t, [0, duration], [1.7, 0.12]);
  const legAmp = interpolate(t, [0, duration], [13, 2.5]);
  const frost = clamp01((t - 1.2) / 3.5);
  const level = interpolate(t, [0, duration], [0.7, 0.08]);
  const zoom = interpolate(t, [0, duration], [1, 1.14]);
  return (
    <SceneShell>
      <Camera scale={zoom}>
        <Sky season="winter" t={t} height={1180} />
        <Ground season="winter" t={t} y={1150} />
        <Ant t={t} x={520} y={1080} scale={3.4} speed={speed} legAmp={legAmp} />
        {/* donan kristal çizgileri */}
        {Array.from({ length: 5 }).map((_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 520 + Math.cos(a) * 190 - 26,
                top: 1080 + Math.sin(a) * 150 - 26,
                width: 52,
                height: 52,
                borderLeft: "3px solid rgba(233,243,243,0.8)",
                borderTop: "3px solid rgba(233,243,243,0.8)",
                transform: `rotate(${a}rad)`,
                opacity: frost * 0.8,
              }}
            />
          );
        })}
        {/* metabolizma çubuğu */}
        <div style={{ position: "absolute", left: 96, top: 620, width: 420 }}>
          <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 28, color: C.cream, textShadow: "0 2px 0 rgba(29,17,6,0.7)", letterSpacing: "0.12em" }}>
            METABOLİZMA
          </div>
          <div style={{ marginTop: 10, height: 26, borderRadius: 13, background: "rgba(29,17,6,0.55)", border: "3px solid rgba(244,236,214,0.8)" }}>
            <div
              style={{
                height: "100%",
                width: `${interpolate(t, [0, duration], [96, 8])}%`,
                borderRadius: 13,
                background: "linear-gradient(90deg,#7fb2c9,#d8c858)",
                transition: "none",
              }}
            />
          </div>
        </div>
        <Thermometer x={880} y={620} level={level} t={t} label={`${Math.round(level * 30 - 20)}°C`} scale={0.85} />
      </Camera>
      <Snow t={t} count={70} opacity={0.7} speed={0.6} />
      <Grade color="#bcd6e2" opacity={0.16 + frost * 0.14} />
      <BigWord text="Metabolizma Yavaşlıyor" t={t} total={duration} y={190} size={70} delay={0.2} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 10) İLKBAHAR — toprak ısıyor, karıncalar yukarı çıkıyor           */
/* ------------------------------------------------------------------ */
export const S10Spring: React.FC<SceneProps> = ({ t, duration }) => {
  const warm = clamp01((t - 0.4) / 3.2);
  const level = interpolate(t, [0, duration], [0.1, 0.85]);
  const camY = interpolate(t, [0, duration], [260, -260]);
  return (
    <SceneShell>
      <Camera y={camY} scale={interpolate(t, [0, duration], [1.05, 1.16])}>
        <Sky season="spring" t={t} height={1180} />
        <Ground season="spring" t={t} y={1150} />
        {/* karıncalar tünelden yukarı */}
        {[0, 1, 2, 3].map((i) => {
          const p = clamp01((t - 0.5 - i * 0.45) / 3.0);
          const y = lerp(1660 - i * 60, 1180, easeOutCubic(p));
          const x = lerp(780 - i * 40, 540, p) + Math.sin(p * 6) * 26;
          return (
            <Ant key={i} t={t * 1.3} x={x} y={y} scale={1.1 + i * 0.12} speed={1.8} opacity={p > 0.02 ? 1 : 0} />
          );
        })}
        <Thermometer x={60} y={560} level={level} t={t} label={`${Math.round(level * 30 - 20)}°C`} />
      </Camera>
      {/* yüzeyde kar erimesi + sürgünler */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1150, height: 60, background: "#f7f9f6", opacity: 1 - warm }} />
      {Array.from({ length: 8 }).map((_, i) => {
        const rnd = seeded(71 + i);
        return (
          <GrassTuft key={i} x={rnd() * 1040} y={1180} scale={0.6 + rnd() * 0.7} color={i % 2 ? C.sage : "#b3c47a"} t={t} phase={i} blades={3} />
        );
      })}
      <Grade color="#d8c858" opacity={warm * 0.2} />
      <BigWord text="İlkbahar Geliyor!" t={t} total={duration} y={190} size={92} delay={0.3} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 11) KAPANIŞ — sessiz tipografi kartı                              */
/* ------------------------------------------------------------------ */
export const S11Closing: React.FC<SceneProps> = ({ t, duration }) => {
  return (
    <SceneShell>
      <Camera scale={interpolate(t, [0, duration], [1.18, 1.05])} y={interpolate(t, [0, duration], [-60, 0])}>
        <Sky season="summer" t={t} height={1180} />
        <Ground season="summer" t={t} y={1150} />
        <div
          style={{
            position: "absolute",
            left: 540 - 90,
            top: 1168,
            width: 180,
            height: 62,
            borderRadius: "50%",
            background: "radial-gradient(ellipse at 50% 30%, #1d1106, #3a2410)",
            border: "6px solid rgba(29,17,6,0.6)",
          }}
        />
        {/* yüzeye çıkan karıncalar */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const p = clamp01((t - i * 0.28) / 2.2);
          const dir = i % 2 ? 1 : -1;
          const x = 540 + dir * lerp(0, 380 + (i % 3) * 90, easeOutCubic(p));
          const y = 1180 + lerp(0, 90 + (i % 3) * 40, p);
          return <Ant key={i} t={t} x={x} y={y} scale={0.9 + (i % 3) * 0.25} speed={1.6} flip={dir < 0} opacity={p > 0.02 ? 1 : 0} />;
        })}
        {[0, 1, 2].map((i) => {
          const rnd = seeded(91 + i);
          return <GrassTuft key={i} x={rnd() * 1000} y={1700} scale={2.2 + rnd()} color="#3a2410" t={t} phase={i} blades={5} />;
        })}
      </Camera>
      <Grade color="#d8c858" opacity={0.18} />
      <ClosingCard t={t} total={duration} title="Ölmediler" sub="sadece birlikte beklediler" />
      <AntDefs />
    </SceneShell>
  );
};
