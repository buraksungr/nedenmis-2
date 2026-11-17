import React from "react";
import { interpolate } from "remotion";
import { C, clamp01, lerp, easeInOutCubic, easeOutCubic, seeded } from "../theme";
import { Ant, AntDefs } from "../components/Ant";
import { Sky, Ground, Thermometer, GrassTuft } from "../components/Environment";
import { SoilCutaway } from "../components/Nest";
import { Tag, Subtitle } from "../components/Text";
import { Camera, SceneShell } from "../components/Camera";
import { Snow } from "../components/Snow";
import { Grade, Flash, Glow } from "../components/Overlays";
import { NestMouth, type SceneProps } from "./Surface";

/** Altyazı + üst etiket — tüm sahnelerde ortak. */
const Overlay: React.FC<SceneProps> = ({ t, duration, narration, audioSec, topLabel }) => (
  <>
    {topLabel && <Tag text={topLabel} t={t} y={92} />}
    {narration && audioSec ? <Subtitle text={narration} t={t} audioSec={audioSec} y={1652} /> : null}
  </>
);

/* ------------------------------------------------------------------ */
/* 5) DİNLENME — derin odacıkta neredeyse hareketsiz küme            */
/* ------------------------------------------------------------------ */
export const S5Dinlenme: React.FC<SceneProps> = (p) => {
  const { t, duration } = p;
  const cx = 540;
  const cy = 1030;
  const still = interpolate(t, [0, 2.5], [0.5, 0.12]);
  const ants = Array.from({ length: 14 }, (_, i) => {
    const rnd = seeded(300 + i);
    const a = rnd() * Math.PI * 2;
    const r = 30 + rnd() * 210;
    return {
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r * 0.66,
      s: 0.85 + rnd() * 0.55,
      flip: rnd() > 0.5,
      ph: rnd() * 6,
    };
  });
  return (
    <SceneShell>
      <Camera scale={interpolate(t, [0, duration], [1, 1.08])}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 46%, #8a5a24 0%, #5a3a18 46%, #2e1c0c 100%)" }} />
        {/* odacık duvarı */}
        <div
          style={{
            position: "absolute",
            left: 70,
            right: 70,
            top: 480,
            bottom: 300,
            borderRadius: "50%",
            border: "10px solid #2b1a0c",
            background: "radial-gradient(ellipse at 50% 42%, #b98a3a 0%, #8a5a24 48%, #5a3a18 100%)",
            boxShadow: "inset 0 0 120px rgba(29,17,6,0.55)",
          }}
        />
        {/* ısı dalgaları */}
        {Array.from({ length: 3 }).map((_, i) => {
          const pr = (t * 0.3 + i / 3) % 1;
          const r = 180 + pr * 560;
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
                border: `3px solid ${C.warmGlow}`,
                opacity: (1 - pr) * 0.18,
              }}
            />
          );
        })}
        {ants.map((a, i) => (
          <Ant
            key={i}
            t={t * 0.4}
            x={a.x}
            y={a.y + Math.sin(t * 0.7 + a.ph) * 2}
            scale={a.s}
            speed={still}
            legAmp={2}
            flip={a.flip}
          />
        ))}
        <Glow x={cx} y={cy} size={1250} opacity={0.7} />
      </Camera>
      <Grade color="#ffcf7a" opacity={0.15} />
      <Overlay {...p} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 6) STOK — yazın biriktirdikleri yiyecekler                         */
/* ------------------------------------------------------------------ */
export const S6Stok: React.FC<SceneProps> = (p) => {
  const { t, duration } = p;
  const seeds = Array.from({ length: 22 }, (_, i) => {
    const rnd = seeded(600 + i);
    return {
      x: 540 + (rnd() - 0.5) * 420,
      y: 1180 + rnd() * 180,
      rx: 16 + rnd() * 18,
      ry: 11 + rnd() * 10,
      rot: rnd() * 180,
      tone: rnd(),
    };
  });
  return (
    <SceneShell>
      <Camera scale={interpolate(t, [0, duration], [1.02, 1.1])}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 58%, #7a5a26 0%, #4a2f12 52%, #241505 100%)" }} />
        {/* odacık */}
        <div
          style={{
            position: "absolute",
            left: 90,
            right: 90,
            top: 700,
            bottom: 240,
            borderRadius: "46%",
            border: "10px solid #2b1a0c",
            background: "radial-gradient(ellipse at 50% 45%, #a8822f 0%, #6b4423 55%, #3a2410 100%)",
            boxShadow: "inset 0 0 110px rgba(29,17,6,0.5)",
          }}
        />
        {/* tohum yığını */}
        {seeds.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x - s.rx,
              top: s.y - s.ry,
              width: s.rx * 2,
              height: s.ry * 2,
              borderRadius: "50%",
              background:
                s.tone > 0.6
                  ? "radial-gradient(circle at 35% 30%, #e0c878, #8a6230)"
                  : "radial-gradient(circle at 35% 30%, #c8a858, #5f3d1c)",
              border: "2.5px solid rgba(43,26,12,0.55)",
              transform: `rotate(${s.rot}deg)`,
            }}
          />
        ))}
        {/* tohum taşıyan karıncalar */}
        {[0, 1, 2].map((i) => {
          const rnd = seeded(650 + i);
          const x0 = 180 + i * 260 + rnd() * 80;
          const p = clamp01((t - 0.3 - i * 0.5) / 3.4);
          const x = lerp(x0, 540, easeInOutCubic(p)) + Math.sin(p * 7) * 14;
          const y = lerp(1010 - i * 40, 1150, p);
          return (
            <React.Fragment key={i}>
              <Ant t={t} x={x} y={y} scale={0.95 + i * 0.12} speed={1.1} legAmp={4} opacity={p > 0.02 ? 1 : 0} />
              <div
                style={{
                  position: "absolute",
                  left: x + 52 * (0.95 + i * 0.12),
                  top: y - 8,
                  width: 30,
                  height: 22,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 30%, #e0c878, #8a6230)",
                  border: "2.5px solid rgba(43,26,12,0.6)",
                  opacity: p > 0.02 ? 1 : 0,
                }}
              />
            </React.Fragment>
          );
        })}
        <Glow x={540} y={1080} size={1150} opacity={0.6} />
      </Camera>
      <Grade color="#d8c858" opacity={0.14} />
      <Overlay {...p} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 7) İLKBAHAR — kamera yukarı çıkıyor, karıncalar tünelde yukarı    */
/* ------------------------------------------------------------------ */
export const S7Ilkbahar: React.FC<SceneProps> = (p) => {
  const { t, duration } = p;
  const warm = clamp01((t - 0.5) / 3.0);
  const camY = interpolate(t, [0, duration], [380, -360]);
  const level = interpolate(t, [0, duration], [0.12, 0.8]);
  return (
    <SceneShell>
      <Camera y={camY} scale={interpolate(t, [0, duration], [1.06, 1.14])}>
        <SoilCutaway t={t} warmth={0.2 + warm * 0.7} />
        {/* yüzey: kar eriyor */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1180 }}>
          <Sky season="spring" t={t} height={1180} />
          <Ground season="spring" t={t} y={1150} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1150, height: 70, background: "#f7f9f6", opacity: 1 - warm }} />
        </div>
        {/* tünelden yukarı çıkan karıncalar */}
        {[0, 1, 2, 3].map((i) => {
          const q = clamp01((t - 0.4 - i * 0.4) / 3.2);
          const y = lerp(1620 - i * 70, 1180, easeOutCubic(q));
          const x = lerp(760 - i * 46, 540, q) + Math.sin(q * 6) * 22;
          return <Ant key={i} t={t * 1.2} x={x} y={y} scale={1.0 + i * 0.1} speed={1.7} opacity={q > 0.02 ? 1 : 0} />;
        })}
        <Thermometer x={60} y={560} level={level} t={t} label={`${Math.round(level * 30 - 20)}°C`} />
      </Camera>
      <Grade color="#d8c858" opacity={warm * 0.2} />
      <Overlay {...p} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 8) BEKLEYİŞ — kış kesiti: yüzey boş, yeraltında koloni            */
/* ------------------------------------------------------------------ */
export const S8Bekleyis: React.FC<SceneProps> = (p) => {
  const { t, duration } = p;
  const cx = 540;
  const cy = 1390;
  const cluster = Array.from({ length: 16 }, (_, i) => {
    const rnd = seeded(800 + i);
    const a = rnd() * Math.PI * 2;
    const r = 26 + rnd() * 150;
    return {
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r * 0.6,
      s: 0.8 + rnd() * 0.45,
      flip: rnd() > 0.5,
      ph: rnd() * 6,
    };
  });
  return (
    <SceneShell>
      <Camera scale={interpolate(t, [0, duration], [1.0, 1.05])}>
        {/* yüzey: kış, boş ve sessiz */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 560 }}>
          <Sky season="winter" t={t} height={560} />
          <Ground season="winter" t={t} y={520} height={120} />
        </div>
        <NestMouth x={540} y={548} scale={0.9} />
        {/* toprak kesiti */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 640, bottom: 0 }}>
          <SoilCutaway t={t} warmth={0.35} seed={12} showTunnels />
        </div>
        {/* yüzeyde tek karınca yok — sadece kar */}
        <Snow t={t} count={110} opacity={0.9} height={620} width={1080} seed={19} />
        {/* yeraltı odacıktaki koloni */}
        <div
          style={{
            position: "absolute",
            left: cx - 250,
            top: cy - 150,
            width: 500,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(ellipse at 50% 45%, rgba(255,207,122,0.22) 0%, rgba(255,207,122,0) 70%)",
          }}
        />
        {cluster.map((a, i) => (
          <Ant
            key={i}
            t={t * 0.4}
            x={a.x}
            y={a.y + Math.sin(t * 0.7 + a.ph) * 2}
            scale={a.s}
            speed={0.14}
            legAmp={1.6}
            flip={a.flip}
          />
        ))}
        <Glow x={cx} y={cy} size={1000} opacity={0.55} />
        {/* kesit çizgisi */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 636, height: 6, background: "rgba(43,26,12,0.7)" }} />
      </Camera>
      <Grade color="#bcd6e2" opacity={0.1} />
      <Overlay {...p} />
      <AntDefs />
    </SceneShell>
  );
};

/* ------------------------------------------------------------------ */
/* 9) SICAK GÜN — bahar/yaz yüzeyi, karıncalar yeniden dolaşıyor     */
/* ------------------------------------------------------------------ */
export const S9SicakGun: React.FC<SceneProps> = (p) => {
  const { t, duration } = p;
  const warm = clamp01(t / 2.2);
  return (
    <SceneShell>
      <Flash t={t} at={0} dur={0.4} color="#f7f9f6" />
      <Camera scale={interpolate(t, [0, duration], [1.06, 1.0])} y={interpolate(t, [0, duration], [-20, 0])}>
        <Sky season="summer" t={t} height={1180} />
        <Ground season="summer" t={t} y={1150} />
        <NestMouth x={540} y={1150} />
        {/* yuva bırakıp yayılan karıncalar */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const rnd = seeded(900 + i);
          const dir = i % 2 ? 1 : -1;
          const p = clamp01((t - i * 0.3) / 2.6);
          const x = 540 + dir * lerp(0, 300 + (i % 3) * 110, easeOutCubic(p));
          const y = 1090 + lerp(0, 60 + (i % 3) * 34, p) + rnd() * 20;
          return <Ant key={i} t={t} x={x} y={y} scale={0.85 + (i % 3) * 0.2} speed={1.5} flip={dir < 0} opacity={p > 0.02 ? 1 : 0} />;
        })}
        {/* yakın plan karınca: ekranın alt kenarından taşmadan */}
        <Ant t={t} x={290} y={1060} scale={1.6} speed={1.2} />
        {[0, 1, 2].map((i) => {
          const rnd = seeded(950 + i);
          return <GrassTuft key={i} x={rnd() * 1000} y={1720} scale={2.2 + rnd()} color="#3a2410" t={t} phase={i} blades={5} />;
        })}
      </Camera>
      <Grade color="#d8c858" opacity={0.12 + warm * 0.08} />
      <Overlay {...p} />
      <AntDefs />
    </SceneShell>
  );
};
