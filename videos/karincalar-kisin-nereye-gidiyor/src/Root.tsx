import React from "react";
import { Composition } from "remotion";
import { AntsWinter } from "./Video";
import { FPS, TOTAL_FRAMES } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ants-winter"
      component={AntsWinter}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{}}
    />
  );
};
