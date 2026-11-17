import React from "react";
import { interpolate } from "remotion";
import { C, clamp01, lerp, easeInOutCubic, easeOutCubic, seeded } from "../theme";
import { Ant, AntDefs } from "../components/Ant";
import { Sky, Ground, Thermometer } from "../components/Environment";
import { SoilCutaway, QueenChamber } from "../components/Nest";
import { BigWord, Kicker } from "../components/Text";
import { Camera, SceneShell } from "../components/Camera";
import { Snow } from "../components/Snow";
import { Grade, Flash, Glow } from "../components/Overlays";
import type { SceneProps } from "./Surface";

/* ------------------------------------------------------------------ */
/* 5) YERALTI SIĞINAĞI — kamera toprağın altına iniyor                */
/* ------------------------------------------------------------------ */
export const S5Retreat: React.FC<SceneProps> = ({ t, duration }) => {
  const p = easeInOutCubic(clamp01(t / 3.6));
  return (
    <SceneShell>
      <Flash t={t} at={0} dur={0.45} color="#1d1106" />
      <Camera scale={interpolate(t, [0, duration], [1, 1.14])}>
        <SoilCutaway t={t} warmth={0.2} />
        {/* yüzey dünyası yukarı kayıp kaybolur */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1920, transform: `translateY(${-p * 1920}px)` }}>
          <Sky season="winter" t={t} height={1180} />
          <Ground season="winter" t={t} y={1150} />
        </div>
        {/* tünele inen karıncalar */}
        {[0, 1, 2, 3, 4].map((i) => {
          const q = clamp01((t - 0.4 - i * 0.35) / 3.2);
          const y = lerp(180, 860 + (i % 3) * 120, easeInOutCubic(q));
          const x = 540 + Math.sin(q * 5 + i) * 24;
          return <Ant key={i} t={t} x={x} y={y} scale={1.0 + (i % 2) * 0.2} speed={1.4} opacity={q > 0.02 ? 1 : 0} />;
        })}
        <Glow x={540} y={1200} size={900} opacity={0.25 + p * 0.3} />
      </Camera>
      <Grade color="#a88838" opacity={p * 0.12} />
      <Kicker text="Koloninin sığınağı" t={t} y={120} />
      <BigWord text="Yeraltı Sığınakları" t={t} total={duration} y={190} size={76} delay={0.25} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 6) DERİNLİK — derine indikçe sıcaklık yükseliyor                  */
/* ------------------------------------------------------------------ */
export const S6Depth: React.FC<SceneProps> = ({ t, duration }) => {
  const warm = clamp01(t / duration);
  const camY = interpolate(t, [0, duration], [120, -420]);
  const depths = [
    { y: 500, label: "-20 cm", temp: "4°C" },
    { y: 950, label: "-60 cm", temp: "8°C" },
    { y: 1400, label: "-120 cm", temp: "11°C" },
  ];
  return (
    <SceneShell>
      <Camera y={camY} scale={interpolate(t, [0, duration], [1, 1.12])}>
        <SoilCutaway t={t} warmth={0.25 + warm * 0.5} />
        {[0, 1, 2].map((i) => {
          const q = clamp01((t - 0.6 - i * 0.8) / 3.5);
          const y = lerp(900 + i * 120, 1660 - i * 60, easeInOutCubic(q));
          return <Ant key={i} t={t} x={300 + i * 220} y={y} scale={1.2} speed={0.5} legAmp={4} opacity={q > 0.02 ? 1 : 0} />;
        })}
        <Glow x={540} y={1500} size={1200} opacity={0.2 + warm * 0.4} />
      </Camera>
      {/* derinlik cetveli */}
      <div style={{ position: "absolute", left: 80, top: 380, bottom: 380, width: 6, background: "rgba(244,236,214,0.5)", borderRadius: 3 }}>
        {depths.map((d, i) => {
          const p = clamp01((t - 0.3 - i * 0.9) / 0.7);
          return (
            <div key={i} style={{ position: "absolute", left: 16, top: `${(d.y - 380) / 1160 * 100}%`, opacity: p, transform: `translateX(${lerp(-16, 0, easeOutCubic(p))}px)` }}>
              <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 26, color: C.cream, textShadow: "0 2px 0 rgba(29,17,6,0.7)", whiteSpace: "nowrap" }}>
                {d.label} · <span style={{ color: C.gold }}>{d.temp}</span>
              </div>
            </div>
          );
        })}
      </div>
      <Grade color="#d8c858" opacity={warm * 0.16} />
      <BigWord text="Derin = Sıcak" t={t} total={duration} y={190} size={100} delay={0.2} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 7) KRALİÇE — kraliçe odacığı                                      */
/* ------------------------------------------------------------------ */
export const S7Queen: React.FC<SceneProps> = ({ t, duration }) => {
  const cx = 540;
  const cy = 1080;
  return (
    <SceneShell>
      <Camera scale={interpolate(t, [0, duration], [1, 1.08])}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, #7a4d1e 0%, #4a2c14 52%, #241505 100%)" }} />
        {/* odacık duvarı */}
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 420,
            bottom: 240,
            borderRadius: "50%",
            border: "12px solid #2b1a0c",
            background: "radial-gradient(ellipse at 50% 42%, #b98a3a 0%, #8a5a24 46%, #5a3a18 100%)",
            boxShadow: "inset 0 0 120px rgba(29,17,6,0.55)",
          }}
        />
        {/* yumurtalar */}
        {Array.from({ length: 14 }).map((_, i) => {
          const rnd = seeded(240 + i);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: cx - 220 + rnd() * 440,
                top: cy + 120 + (rnd() - 0.5) * 120,
                width: 26 + rnd() * 16,
                height: 18 + rnd() * 10,
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 30%, #fbf4e2, #d8c8a0)",
                border: "2px solid rgba(43,26,12,0.45)",
                transform: `rotate(${rnd() * 90}deg)`,
              }}
            />
          );
        })}
        {/* kraliçe */}
        <Ant t={t} x={cx} y={cy} scale={3.4} variant="queen" speed={0.22} legAmp={2.5} />
        {/* işçiler */}
        {Array.from({ length: 8 }).map((_, i) => {
          const rnd = seeded(200 + i);
          const a = (i / 8) * Math.PI * 2;
          const r = 250 + rnd() * 110;
          return (
            <Ant
              key={i}
              t={t + i * 0.4}
              x={cx + Math.cos(a) * r}
              y={cy + Math.sin(a) * r * 0.5}
              scale={1.1 + rnd() * 0.3}
              speed={0.45}
              legAmp={4}
              flip={rnd() > 0.5}
            />
          );
        })}
        <Glow x={cx} y={cy - 40} size={1300} opacity={0.7} />
      </Camera>
      <Grade color="#ffcf7a" opacity={0.16} />
      <Kicker text="Kış rol dağılımı" t={t} y={120} />
      <BigWord text="Kraliçe Durur" t={t} total={duration} y={190} size={100} delay={0.2} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 8) KÜME — kristalleşmiş karınca kümesi                            */
/* ------------------------------------------------------------------ */
export const S8Cluster: React.FC<SceneProps> = ({ t, duration }) => {
  const cx = 540;
  const cy = 900;
  const ants = Array.from({ length: 15 }, (_, i) => {
    const rnd = seeded(300 + i);
    const a = rnd() * Math.PI * 2;
    const r = 40 + rnd() * 260;
    return {
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r * 0.72,
      s: 0.9 + rnd() * 0.7,
      flip: rnd() > 0.5,
      ph: rnd() * 6,
    };
  });
  return (
    <SceneShell>
      <Camera rotate={Math.sin(t * 0.5) * 2.5} scale={interpolate(t, [0, duration], [1, 1.1])}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 45%, #8a5a24 0%, #5a3a18 45%, #2e1c0c 100%)" }} />
        {/* ısı dalgaları */}
        {Array.from({ length: 4 }).map((_, i) => {
          const p = (t * 0.4 + i / 4) % 1;
          const r = 220 + p * 620;
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
                border: `4px solid ${C.warmGlow}`,
                opacity: (1 - p) * 0.22,
              }}
            />
          );
        })}
        {ants.map((a, i) => (
          <Ant
            key={i}
            t={t * 0.4}
            x={a.x}
            y={a.y + Math.sin(t * 0.8 + a.ph) * 3}
            scale={a.s}
            speed={0.25}
            legAmp={2}
            flip={a.flip}
          />
        ))}
        <Glow x={cx} y={cy} size={1300} opacity={0.75} />
      </Camera>
      <BigWord text="Küme = Isı" t={t} total={duration} y={190} size={104} delay={0.2} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 9) TÜRLER — iki farklı kış stratejisi yan yana                    */
/* ------------------------------------------------------------------ */
export const S9Species: React.FC<SceneProps> = ({ t, duration }) => {
  const pan = interpolate(t, [0, duration], [-70, 70]);
  return (
    <SceneShell>
      <Camera x={pan}>
        {/* sol: küme yapan tür */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 540, height: 1920, overflow: "hidden", borderRight: "8px solid #2b1a0c" }}>
          <div style={{ position: "absolute", left: -540, top: 0, width: 1080, height: 1920 }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, #4a3a20 0%, #241505 70%)" }} />
            {Array.from({ length: 12 }).map((_, i) => {
              const rnd = seeded(400 + i);
              const a = rnd() * Math.PI * 2;
              const r = 40 + rnd() * 190;
              return (
                <Ant key={i} t={t * 0.4} x={540 + Math.cos(a) * r} y={960 + Math.sin(a) * r * 0.7} scale={0.8 + rnd() * 0.5} speed={0.2} legAmp={2} flip={rnd() > 0.5} />
              );
            })}
            <div style={{ position: "absolute", left: 0, right: 0, top: 1560, textAlign: "center", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 30, color: C.sand }}>
              ILIMAN KLİMA
            </div>
          </div>
        </div>
        {/* sağ: kar altında çalışan tür */}
        <div style={{ position: "absolute", left: 540, top: 0, width: 540, height: 1920, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: -540, top: 0, width: 1080, height: 1920 }}>
            <Sky season="winter" t={t} height={1180} />
            <Ground season="winter" t={t} y={1150} />
            {/* kar altı toprak bandı */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 1150, height: 770, background: "linear-gradient(180deg,#7d5a28 0%,#5f3d1c 45%,#40260f 100%)" }} />
            {Array.from({ length: 14 }).map((_, i) => {
              const rnd = seeded(700 + i);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: rnd() * 540,
                    top: 1180 + rnd() * 680,
                    width: 16 + rnd() * 40,
                    height: 10 + rnd() * 20,
                    borderRadius: "50%",
                    background: "rgba(29,17,6,0.3)",
                  }}
                />
              );
            })}
            {/* kar altı faal karıncalar */}
            {[0, 1, 2, 3].map((i) => {
              const rnd = seeded(600 + i);
              return (
                <Ant key={i} t={t + i * 0.3} x={700 + rnd() * 250 + t * 40} y={1400 + rnd() * 200} scale={0.9 + rnd() * 0.4} speed={1.6} />
              );
            })}
            <Snow t={t} count={40} opacity={0.5} height={1180} speed={0.5} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 1560, textAlign: "center", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 30, color: C.sand }}>
              KAR ALTININ ALTINDA AKTİF
            </div>
          </div>
        </div>
      </Camera>
      <BigWord text="Her Tür Aynı Değil" t={t} total={duration} y={190} size={72} delay={0.2} />
      <AntDefs />
    </SceneShell>
  );
};
