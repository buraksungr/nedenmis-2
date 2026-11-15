import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveTopic, buildResearchSummary, KNOWLEDGE_CARDS } from "../../packages/core/src/ontology/resolve.ts";

test("elmas konusu doğru bilgi kartına çözümlenir", () => {
  const r = resolveTopic("Elmas neden kolay kırılmaz?");
  assert.ok(r.card, "kart bulunmalı");
  assert.equal(r.card!.id, "diamond-hardness");
  assert.ok(r.card!.domains.includes("materials"));
  assert.ok(r.confidence > 0.5);
});

test("gökyüzü konusu atmosfer kartına çözümlenir", () => {
  const r = resolveTopic("Gökyüzü neden mavi?");
  assert.equal(r.card?.id, "sky-blue");
});

test("mitokondri konusu biyoloji kartına çözümlenir (bağlam korunur)", () => {
  const r = resolveTopic("Mitokondri neden önemli?");
  assert.equal(r.card?.id, "mitochondria-atp");
  assert.ok(r.card!.domains.includes("biology"));
});

test("ilgisiz konu kart bulmadan reddedilir", () => {
  const r = resolveTopic("En sevdiğim pizza tarifi nasıl olmalı?");
  assert.ok(!r.card);
  assert.ok(r.reason.length > 10);
});

test("araştırma özeti en az bir kaynak ve kanıt içerir", () => {
  const r = resolveTopic("Denizler neden tuzlu?");
  assert.ok(r.card);
  const summary = buildResearchSummary(r.card!, "Denizler neden tuzlu?", r.confidence);
  assert.ok(summary.sources.length >= 1);
  assert.ok(summary.facts.length >= 3);
  assert.ok(summary.summaryTr.length > 40);
  assert.equal(summary.mode, "curated-kb");
});

test("her bilgi kartı en az 3 kaynak ve 3 mekanizma adımı taşır", () => {
  for (const card of KNOWLEDGE_CARDS) {
    assert.ok(card.sources.length >= 2, `${card.id}: kaynak`);
    assert.ok(card.steps.length >= 3, `${card.id}: adım`);
    for (const s of card.steps) {
      assert.ok(s.narration.trim().split(/\s+/).length >= 6, `${card.id}/${s.id}: anlatım çok kısa`);
      assert.ok(s.concepts.length >= 1, `${card.id}/${s.id}: kavram yok`);
    }
  }
});
