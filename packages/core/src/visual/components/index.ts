import type { VisualComponent } from "./types.js";
import { bondNetwork, brittlenessCompare, cleavageFracture, crystalLattice, hardnessMeasure } from "./materials.js";
import { atmospherePath, rayleighScattering, spectrumSplit, wavelengthScale } from "./optics.js";
import { evaporationCycle, ionSolution, riverToSea, rockWeathering } from "./earth.js";
import { accretionDisk, eventHorizon, gravitationalLensing, spacetimeGrid } from "./astro.js";
import { electronDrift, electronSea, insulatorCompare, resistanceHeat } from "./electric.js";
import { faultRupture, plateMotion, seismicWaves, elasticStrain } from "./geology.js";
import { freeFall, gravityVectors, orbitFall } from "./physics.js";
import { atpSynthaseRotor, cellSection, metabolismSummary, mitochondrionCross, protonGradient } from "./biology.js";
import { brainRegions, calvinCycle, chloroplastZoom, leafSection, lightReaction, neuronSignal, synapseZoom, synapticPlasticity } from "./biology2.js";
import { schematicDiagram } from "./schematic.js";

export const VISUAL_COMPONENTS: VisualComponent[] = [
  crystalLattice,
  bondNetwork,
  hardnessMeasure,
  brittlenessCompare,
  cleavageFracture,
  spectrumSplit,
  rayleighScattering,
  wavelengthScale,
  atmospherePath,
  rockWeathering,
  riverToSea,
  ionSolution,
  evaporationCycle,
  spacetimeGrid,
  eventHorizon,
  accretionDisk,
  gravitationalLensing,
  electronSea,
  electronDrift,
  resistanceHeat,
  insulatorCompare,
  plateMotion,
  elasticStrain,
  faultRupture,
  seismicWaves,
  gravityVectors,
  freeFall,
  orbitFall,
  cellSection,
  mitochondrionCross,
  protonGradient,
  atpSynthaseRotor,
  metabolismSummary,
  leafSection,
  chloroplastZoom,
  lightReaction,
  calvinCycle,
  neuronSignal,
  synapseZoom,
  synapticPlasticity,
  brainRegions,
  schematicDiagram,
];

const BY_ID = new Map(VISUAL_COMPONENTS.map((c) => [c.id, c]));

export function getComponent(id: string): VisualComponent | undefined {
  return BY_ID.get(id);
}

export function requireComponent(id: string): VisualComponent {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`Bilinmeyen görsel bileşen: ${id}`);
  return c;
}

export type { VisualComponent } from "./types.js";
export { schematicDiagram };
