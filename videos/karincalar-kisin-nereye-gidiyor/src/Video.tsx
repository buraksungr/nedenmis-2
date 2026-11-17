import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { FPS, TIMELINE, type TimelineEntry } from "./timeline";
import { S1Hook, S2Kabol, S3Yavasliyor, S4Derinyuva, type SceneProps } from "./scenes/Surface";
import { S5Dinlenme, S6Stok, S7Ilkbahar, S8Bekleyis, S9SicakGun } from "./scenes/Underground";

const SCENES: Record<string, React.FC<SceneProps>> = {
  "s1-hook": S1Hook,
  "s2-kabol": S2Kabol,
  "s3-yavasliyor": S3Yavasliyor,
  "s4-derinyuva": S4Derinyuva,
  "s5-dinlenme": S5Dinlenme,
  "s6-stok": S6Stok,
  "s7-ilkbahar": S7Ilkbahar,
  "s8-bekleyis": S8Bekleyis,
  "s9-sicakgun": S9SicakGun,
};

const SceneHost: React.FC<{ entry: TimelineEntry }> = ({ entry }) => {
  const frame = useCurrentFrame();
  const Comp = SCENES[entry.id];
  if (!Comp) return null;
  return (
    <Comp
      t={frame / FPS}
      duration={entry.duration / FPS}
      narration={entry.narration}
      audioSec={entry.audioSec}
      topLabel={entry.topLabel}
    />
  );
};

export const AntsWinter: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#1d1106" }}>
      {TIMELINE.map((entry) => (
        <Sequence key={entry.id} from={entry.start} durationInFrames={entry.duration} name={entry.id}>
          <SceneHost entry={entry} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
