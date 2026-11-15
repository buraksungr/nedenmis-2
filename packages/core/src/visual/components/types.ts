import type { Domain, KnowledgeCard } from "../../ontology/types.js";
import type { Palette } from "../primitives.js";

export type Params = Record<string, string | number | boolean | string[]>;

export type ParamDoc = {
  name: string;
  type: "string" | "number" | "string[]";
  default: string | number | string[];
  desc: string;
};

export type RenderCtx = {
  /** Sahne içi yerel zaman (sn). */
  t: number;
  /** Sahne süresi (sn). */
  dur: number;
  params: Params;
  pal: Palette;
  card: KnowledgeCard;
};

export type VisualComponent = {
  id: string;
  labelTr: string;
  domains: Domain[];
  /** Bu bileşenin anlatabildiği mekanizmalar. */
  mechanisms: string[];
  /** Bileşenin doğru biçimde gösterebildiği kavramlar (küresel sözlükten). */
  concepts: string[];
  /** Bu bileşenle asla bir arada kullanılmaması gereken kavramlar. */
  incompatibleConcepts: string[];
  params: ParamDoc[];
  /** Deterministik kare üretici. */
  render: (ctx: RenderCtx) => string;
  /** Bilimsel sınırlama / doğruluk notu. */
  scientificNote: string;
};

export const str = (p: Params, k: string, d: string): string => (typeof p[k] === "string" ? (p[k] as string) : d);
export const num = (p: Params, k: string, d: number): number => (typeof p[k] === "number" ? (p[k] as number) : d);
export const bool = (p: Params, k: string, d: boolean): boolean => (typeof p[k] === "boolean" ? (p[k] as boolean) : d);
export const arr = (p: Params, k: string, d: string[]): string[] => (Array.isArray(p[k]) ? (p[k] as string[]) : d);
