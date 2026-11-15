import assert from "node:assert/strict";
import { test } from "node:test";
import { getCard } from "../../packages/core/src/ontology/resolve.ts";
import { planScenes } from "../../packages/core/src/visual/planner.ts";
import { buildTimeline, DurationError } from "../../packages/core/src/render/timeline.ts";

test("ölçülen ses süreleriyle zaman çizelgesi hedefe oturur", () => {
  const card = getCard("sky-blue")!;
  const scenes = planScenes(card, { targetDurationSec: 45 }).scenes;
  // Ölçülen konuşma, hedefin %94'ünü kaplayacak şekilde dağıtılır.
  const per = (45 * 0.94) / scenes.length;
  const speech: Record<string, number> = {};
  scenes.forEach((s) => (speech[s.id] = per));
  const tl = buildTimeline(scenes, { targetDurationSec: 45, fps: 30, speechDurations: speech });
  assert.equal(tl.fps, 30);
  assert.equal(tl.frames, Math.round(tl.durationSec * tl.fps));
  assert.ok(Math.abs(tl.durationSec - 45) / 45 <= 0.05, `süre ${tl.durationSec}`);
  assert.equal(tl.withinTolerance, true);
});

test("anlatım hedefi aşarsa sessizce kırpılmaz, hata verir", () => {
  const card = getCard("ocean-salty")!;
  const scenes = planScenes(card, { targetDurationSec: 30 }).scenes;
  const speech: Record<string, number> = {};
  scenes.forEach((s) => (speech[s.id] = 20));
  assert.throws(() => buildTimeline(scenes, { targetDurationSec: 30, speechDurations: speech }), DurationError);
});

test("konuşma hedefin çok altındaysa tolerans dürüstçe bildirilir", () => {
  const card = getCard("sky-blue")!;
  const scenes = planScenes(card, { targetDurationSec: 60 }).scenes;
  const speech: Record<string, number> = {};
  scenes.forEach((s) => (speech[s.id] = 5));
  const tl = buildTimeline(scenes, { targetDurationSec: 60, fps: 30, speechDurations: speech });
  assert.equal(tl.withinTolerance, false);
  assert.ok(tl.warnings.length > 0);
});

test("kare sayısı her zaman tam sayı ve fps ile tutarlı", () => {
  const card = getCard("metal-conduction")!;
  const scenes = planScenes(card, { targetDurationSec: 60 }).scenes;
  const tl = buildTimeline(scenes, { targetDurationSec: 60, fps: 30 });
  assert.equal(Number.isInteger(tl.frames), true);
  assert.ok(tl.frames > 0);
  assert.ok(tl.subtitleTiming === "phrase-estimated" || tl.subtitleTiming === "word-aligned");
});
