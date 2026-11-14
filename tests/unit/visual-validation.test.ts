import assert from "node:assert/strict";
import { test } from "node:test";
import { getCard } from "../../packages/core/src/ontology/resolve.ts";
import { planScenes, buildScene } from "../../packages/core/src/visual/planner.ts";
import { validateScene, validatePlan, assertApproved, VisualValidationError } from "../../packages/core/src/visual/validate.ts";
import { requireComponent } from "../../packages/core/src/visual/components/index.ts";

test("elmas planı yalnızca malzeme/jeoloji görselleri kullanır (biyoloji sızıntısı yok)", () => {
  const card = getCard("diamond-hardness")!;
  const plan = planScenes(card, { targetDurationSec: 60 });
  for (const scene of plan.scenes) {
    const comp = requireComponent(scene.spec.componentId);
    assert.ok(!comp.domains.includes("biology"), `${scene.id} biyoloji bileşeni kullanıyor: ${comp.id}`);
    assert.ok(
      ["materials", "geology", "physics", "schematic"].some((d) => comp.domains.includes(d as never)),
      `${scene.id}: beklenmeyen alan ${comp.domains.join(",")}`,
    );
    assert.equal(scene.validation.status, "approved", `${scene.id} reddedildi: ${scene.validation.checks.filter((c) => !c.ok).map((c) => c.message).join("; ")}`);
  }
});

test("mitokondri planı biyoloji görselleri kullanır", () => {
  const card = getCard("mitochondria-atp")!;
  const plan = planScenes(card, { targetDurationSec: 60 });
  const domains = plan.scenes.map((s) => requireComponent(s.spec.componentId).domains);
  assert.ok(domains.some((d) => d.includes("biology")), "biyoloji bileşeni beklenir");
});

test("yanlış sahne görseli reddedilir ve render kapısı kapanır", () => {
  const card = getCard("diamond-hardness")!;
  const plan = planScenes(card, { targetDurationSec: 60 });
  const scene = plan.scenes[0];
  // Elmas sertliği sahnesine ait hücre zarı bileşeni zorla takılır.
  const broken = {
    ...scene,
    spec: { ...scene.spec, componentId: "cell_section", mechanism: scene.spec.mechanism, rationale: "test" },
  };
  const sceneValidation = validateScene(card, broken);
  assert.equal(sceneValidation.status, "rejected");
  assert.ok(sceneValidation.checks.some((c) => !c.ok && c.severity === "error"));

  const patched = plan.scenes.map((s, i) => (i === 0 ? { ...s, spec: broken.spec } : s));
  const planReport = validatePlan(card, patched);
  assert.equal(planReport.status, "rejected");
  assert.throws(() => assertApproved(card, patched), VisualValidationError);
});

test("mekanizma uyuşmazlığı hata üretir", () => {
  const card = getCard("sky-blue")!;
  const plan = planScenes(card, { targetDurationSec: 45 });
  const scene = plan.scenes[0];
  const wrong = { ...scene, spec: { ...scene.spec, mechanism: "cleavage" } };
  const report = validateScene(card, wrong);
  assert.equal(report.status, "rejected");
});

test("buildScene her zaman doğrulanmış bir görsel spec üretir", () => {
  const card = getCard("black-hole")!;
  const step = card.steps[0];
  const scene = buildScene(card, step, 0, { targetDurationSec: 45 });
  assert.ok(scene.spec.componentId);
  assert.ok(["approved", "rejected"].includes(scene.validation.status));
  assert.ok(scene.overlay.length > 0);
});
