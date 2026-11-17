import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createProject, narrateProject, renderProject } from "../../packages/core/src/project/pipeline.ts";

/**
 * Uçtan uca duman testi: gerçek TTS + gerçek FFmpeg + gerçek FFprobe.
 * Kare sayısı bilinçli olarak sınırlanır (frameLimit) — bu test hızlıdır,
 * yayın örnekleri scripts/render-samples.ts ile tam süreli üretilir.
 */
// Gerçek TTS varsayılandır. TTS bulunmayan ortamlarda (ör. Linux sandbox) sessiz motor
// açıkça seçilebilir; bu durum raporda "ses: sessiz" olarak görünür, gizlenmez.
const E2E_ENGINE = (process.env.NEDENMIS_E2E_ENGINE ?? "espeak") as "espeak" | "silent" | "sapi" | "chatterbox" | "piper";

test("kısa video gerçek ses ve görüntüyle üretilir", { timeout: 240_000 }, async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "nedenmis-e2e-"));
  const { project } = createProject({
    topic: "Gökyüzü neden mavi?",
    targetDurationSec: 30,
    quality: "draft",
    narration: { engine: E2E_ENGINE },
  });
  assert.equal(project.validation?.status, "approved");

  const narrated = await narrateProject(project, dataDir, undefined);
  const measured = Object.values(narrated.narration.measured);
  assert.ok(measured.length > 0, "ses süreleri ölçülmedi");
  for (const file of Object.values(narrated.narration.audioFiles)) assert.ok(fs.existsSync(file), `ses dosyası yok: ${file}`);

  const result = await renderProject(narrated, dataDir, {
    dataDir,
    narration: narrated.narration,
    frameLimit: 40,
  });

  assert.ok(fs.existsSync(result.videoPath), "mp4 üretilmedi");
  assert.ok(fs.statSync(result.videoPath).size > 20_000, "mp4 çok küçük");
  assert.ok(result.verification.video.width > 0);
  assert.equal(result.verification.video.codec, "h264");
  assert.equal(result.verification.audio.codec, "aac");
  assert.equal(result.verification.audio.sampleRate, 48000);
  assert.ok(fs.existsSync(result.project.outputs.srtPath!), "srt yazılmadı");
  assert.ok(fs.existsSync(result.project.outputs.validationPath!), "görsel doğrulama raporu yazılmadı");

  fs.rmSync(dataDir, { recursive: true, force: true });
});
