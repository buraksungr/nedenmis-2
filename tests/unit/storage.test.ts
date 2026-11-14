import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createProject } from "../../packages/core/src/project/pipeline.ts";
import { ProjectStore } from "../../packages/core/src/storage/store.ts";

test("proje deposu projeleri kalıcı olarak saklar ve listeler", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nedenmis-store-"));
  const store = new ProjectStore(dir);
  const { project } = createProject({ topic: "Kara delik nedir?", targetDurationSec: 45 });
  store.upsert(project);

  const loaded = store.get(project.id);
  assert.ok(loaded);
  assert.equal(loaded!.topic, "Kara delik nedir?");
  assert.equal(loaded!.scenes.length, project.scenes.length);

  const list = store.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].id, project.id);

  store.log(project.id, "info", "test kaydı");
  assert.equal(store.delete(project.id), true);
  assert.equal(store.get(project.id), null);
  assert.equal(store.list().length, 0);

  store.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("aynı proje iki kez kaydedilirse tek kayıt kalır", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nedenmis-store-"));
  const store = new ProjectStore(dir);
  const { project } = createProject({ topic: "Gökyüzü neden mavi?", targetDurationSec: 30 });
  store.upsert(project);
  store.upsert({ ...project, title: "Güncellendi" });
  assert.equal(store.list().length, 1);
  assert.equal(store.get(project.id)!.title, "Güncellendi");
  store.close();
  fs.rmSync(dir, { recursive: true, force: true });
});
