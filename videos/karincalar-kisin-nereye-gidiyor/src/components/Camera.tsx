import React from "react";
import { AbsoluteFill } from "remotion";

/** Sinematik kamera: ölçek + pan + hafif döndürme. */
export const Camera: React.FC<{
  scale?: number;
  x?: number;
  y?: number;
  rotate?: number;
  children: React.ReactNode;
}> = ({ scale = 1, x = 0, y = 0, rotate = 0, children }) => (
  <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)` }}>
    {children}
  </AbsoluteFill>
);

/** Tüm sahnelerde ortak doku + vinyet. */
export const SceneShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    {children}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/public/grain.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "340px 340px",
        opacity: 0.1,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/public/vignette.png')",
        backgroundSize: "cover",
        opacity: 0.5,
        pointerEvents: "none",
      }}
    />
  </AbsoluteFill>
);
