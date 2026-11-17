import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { FPS, TIMELINE, type TimelineEntry } from "./timeline";
import { S1Hook, S2Merak, S3ColdBlooded, S4Metabolism, S10Spring, S11Closing, type SceneProps } from "./scenes/Surface";
import { S5Retreat, S6Depth, S7Queen, S8Cluster, S9Species } from "./scenes/Underground";

const SCENES: Record<string, React.FC<SceneProps>> = {
  "s1-hook": S1Hook,
  "s2-merak": S2Merak,
  "s3-sogukkanli": S3ColdBlooded,
  "s4-metabolizma": S4Metabolism,
  "s5-sekilme": S5Retreat,
  "s6-derinlik": S6Depth,
  "s7-kralice": S7Queen,
  "s8-kume": S8Cluster,
  "s9-turler": S9Species,
  "s10-ilkbahar": S10Spring,
  "s11-kapanis": S11Closing,
};

const SceneHost: React.FC<{ entry: TimelineEntry }> = ({ entry }) => {
  const frame = useCurrentFrame();
  const Comp = SCENES[entry.id];
  if (!Comp) return null;
  return <Comp t={frame / FPS} duration={entry.duration / FPS} />;
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
