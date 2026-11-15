import assert from "node:assert/strict";
import { test } from "node:test";
import { VISUAL_COMPONENTS } from "../../packages/core/src/visual/components/index.ts";
import { paletteFor } from "../../packages/core/src/visual/primitives.ts";
import { getCard } from "../../packages/core/src/ontology/resolve.ts";
import type { Params } from "../../packages/core/src/visual/components/types.ts";

const card = getCard("diamond-hardness")!;

function defaultParams(params: { name: string; default: string | number | string[] }[]): Params {
  const out: Params = {};
  for (const p of params) out[p.name] = p.default;
  return out;
}

test("katalog en az 35 görsel bileşen içerir", () => {
  assert.ok(VISUAL_COMPONENTS.length >= 35, `bileşen sayısı ${VISUAL_COMPONENTS.length}`);
});

test("tüm bileşenler geçerli SVG üretir (NaN / undefined yok)", () => {
  for (const comp of VISUAL_COMPONENTS) {
    const svg = comp.render({
      t: 1.35,
      dur: 6,
      params: defaultParams(comp.params),
      pal: paletteFor(comp.domains[0] ?? "physics"),
      card,
    });
    assert.ok(svg.length > 80, `${comp.id}: çıktı çok kısa`);
    assert.ok(!svg.includes("NaN"), `${comp.id}: NaN içeriyor`);
    assert.ok(!svg.includes("undefined"), `${comp.id}: undefined içeriyor`);
    // Dejenere geometri koruması: aşırı büyük koordinatlar resvg'de panik üretebiliyor.
    const withoutHex = svg.replace(/#[0-9a-fA-F]{3,8}/g, "");
    const nums = withoutHex.match(/-?\d+(?:\.\d+)?/g) ?? [];
    const extreme = nums.find((v) => Math.abs(Number(v)) > 6000);
    assert.ok(!extreme, `${comp.id}: aşırı koordinat (${extreme})`);
    const opens = (svg.match(/</g) ?? []).length;
    const closes = (svg.match(/>/g) ?? []).length;
    assert.ok(opens > 3 && closes === opens, `${comp.id}: etiket dengesi bozuk`);
  }
});

test("her bileşen bilimsel sınırlama notu ve en az bir kavram bildirir", () => {
  for (const comp of VISUAL_COMPONENTS) {
    assert.ok(comp.scientificNote.length > 20, `${comp.id}: not eksik`);
    assert.ok(comp.concepts.length >= 1, `${comp.id}: kavram yok`);
    assert.ok(comp.mechanisms.length >= 1, `${comp.id}: mekanizma yok`);
  }
});
