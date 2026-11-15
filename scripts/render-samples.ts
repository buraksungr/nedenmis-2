/**
 * Yayın örneklerini üretir: altı zorunlu konu, 60 sn, 1080×1920, yüksek kalite.
 *
 *   node --import tsx scripts/render-samples.ts
 *
 * Gerçek TTS (eSpeak NG), gerçek FFmpeg render ve gerçek FFprobe doğrulaması
 * kullanır. Çıktılar samples/<slug>/ altına kopyalanır ve samples/manifest.json
 * bu ortamda ölçülen değerlerle yazılır (uydurma değer yok).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { runPipeline } from "../packages/core/src/project/pipeline.ts";
import { resolveDataDir } from "../packages/core/src/render/tools.ts";

export const SAMPLES = [
  { slug: "elmas-neden-kirilmaz", topic: "Elmas neden kolay kırılmaz?", duration: 60 },
  { slug: "gokyuzu-neden-mavi", topic: "Gökyüzü neden mavi?", duration: 60 },
  { slug: "denizler-neden-tuzlu", topic: "Denizler neden tuzlu?", duration: 60 },
  { slug: "kara-delik-nedir", topic: "Kara delik nedir?", duration: 60 },
  { slug: "metaller-neden-iletken", topic: "Metaller neden elektriği iletir?", duration: 60 },
  { slug: "mitokondri-neden-onemli", topic: "Mitokondri neden önemli?", duration: 60 },
];

const quality = (process.env.SAMPLE_QUALITY as "draft" | "standard" | "high") ?? "high";
// Ortam değişkenleriyle örnek üretimi: dil düzeyi, motor ve süre.
const languageLevel = (process.env.SAMPLE_LANGUAGE_LEVEL as "simple" | "standard" | "detailed") ?? "simple";
const engine = (process.env.SAMPLE_ENGINE as "espeak" | "sapi" | "chatterbox" | "silent") ?? "espeak";
const durationOverride = process.env.SAMPLE_DURATION ? Number(process.env.SAMPLE_DURATION) : null;
const dataDir = path.join(resolveDataDir(), "samples-work");
const outRoot = path.join(process.cwd(), "samples");

type ManifestEntry = {
  slug: string;
  topic: string;
  title: string;
  cardId: string;
  targetDurationSec: number;
  durationSec: number;
  frames: number;
  fps: number;
  resolution: string;
  videoCodec: string;
  audioCodec: string;
  audioSampleRate: number;
  videoPath: string;
  subtitlePath: string;
  posterPath: string;
  verificationPath: string;
  validationPath: string;
  sha256: string;
  bytes: number;
  verificationOk: boolean;
  failedChecks: string[];
  scenes: { id: string; component: string; mechanism: string; status: string; score: number; durationSec: number; speechDurationSec: number }[];
  narrationEngine: string;
  narrationNote: string;
  quality: string;
  languageLevel: string;
  scriptQuality: { score: number; avgWordsPerSentence: number; longestSentenceWords: number; technicalTermCount: number; hook: boolean };
  visualComplexity: string;
  renderSeconds: number;
  generatedAt: string;
};

const only = process.argv.slice(2);

async function main() {
  fs.mkdirSync(outRoot, { recursive: true });
  const manifestPath = path.join(outRoot, "manifest.json");
  const manifest: ManifestEntry[] = fs.existsSync(manifestPath) ? (JSON.parse(fs.readFileSync(manifestPath, "utf8")) as ManifestEntry[]) : [];
  const targets = only.length ? SAMPLES.filter((s) => only.includes(s.slug)) : SAMPLES;

  for (const sample of targets) {
    const started = Date.now();
    console.log(`\n=== ${sample.slug} — ${sample.topic} (${sample.duration} sn, ${quality}) ===`);
    const result = await runPipeline(
      {
        topic: sample.topic,
        targetDurationSec: durationOverride ?? sample.duration,
        quality,
        languageLevel,
        // Ses ayarı proje girdisinde olmalı; opts içindeki narration yalnızca render aşamasına geçer.
        narration: { engine, voice: "tr", rate: 165 },
      },
      {
        dataDir,
        log: (m) => console.log("  ", m),
        onProgress: (u) => {
          if (u.stage === "render" && u.detail) process.stdout.write(`\r   render ${Math.round(u.progress * 100)}% ${u.detail}   `);
        },
      },
    );

    const dir = path.join(outRoot, sample.slug);
    fs.mkdirSync(dir, { recursive: true });
    const p = result.project;
    const videoName = `${sample.slug}-${p.targetDurationSec}s.mp4`;
    // Aynı konunun eski (ör. 60 sn, farklı kalite) videoları kalmaz — yayında tek güncel örnek olur.
    for (const old of fs.readdirSync(dir)) {
      if (old.endsWith(".mp4") && old !== videoName) {
        fs.rmSync(path.join(dir, old), { force: true });
        console.log(`  eski örnek silindi: ${old}`);
      }
    }
    fs.copyFileSync(result.videoPath, path.join(dir, videoName));
    if (p.outputs.srtPath) fs.copyFileSync(p.outputs.srtPath, path.join(dir, `${sample.slug}.srt`));
    if (p.outputs.posterPath) fs.copyFileSync(p.outputs.posterPath, path.join(dir, "poster.png"));
    if (p.outputs.verificationPath) fs.copyFileSync(p.outputs.verificationPath, path.join(dir, "verification.json"));
    if (p.outputs.validationPath) fs.copyFileSync(p.outputs.validationPath, path.join(dir, "visual-validation.json"));
    const timed = new Map(result.timeline.scenes.map((t) => [t.id, t]));
    fs.writeFileSync(
      path.join(dir, "script.txt"),
      `${p.title}\n${p.topic}\n\n` +
        p.scenes
          .map((s, i) => {
            const t = timed.get(s.id);
            const timing = t ? `[${t.startSec.toFixed(2)}–${(t.startSec + t.durationSec).toFixed(2)} sn | konuşma ${t.speechDurationSec.toFixed(2)} sn]` : "";
            return `${i + 1}. ${timing} ${s.narration}`;
          })
          .join("\n\n") +
        "\n",
      "utf8",
    );

    const buf = fs.readFileSync(path.join(dir, videoName));
    const entry: ManifestEntry = {
      slug: sample.slug,
      topic: sample.topic,
      title: p.title,
      cardId: p.research?.cardId ?? "",
      targetDurationSec: p.targetDurationSec,
      durationSec: result.verification.durationSec,
      frames: result.verification.video.framesRead,
      fps: result.verification.video.fps,
      resolution: `${result.verification.video.width}x${result.verification.video.height}`,
      videoCodec: result.verification.video.codec,
      audioCodec: result.verification.audio.codec,
      audioSampleRate: result.verification.audio.sampleRate,
      videoPath: `samples/${sample.slug}/${videoName}`,
      subtitlePath: `samples/${sample.slug}/${sample.slug}.srt`,
      posterPath: `samples/${sample.slug}/poster.png`,
      verificationPath: `samples/${sample.slug}/verification.json`,
      validationPath: `samples/${sample.slug}/visual-validation.json`,
      quality,
      languageLevel: p.languageLevel,
      scriptQuality: {
        score: p.scriptQuality?.score ?? 0,
        avgWordsPerSentence: p.scriptQuality?.avgWordsPerSentence ?? 0,
        longestSentenceWords: p.scriptQuality?.longestSentenceWords ?? 0,
        technicalTermCount: p.scriptQuality?.technicalTermCount ?? 0,
        hook: p.scriptQuality?.hook.ok ?? false,
      },
      visualComplexity: p.visualComplexity ?? "sade",
      sha256: crypto.createHash("sha256").update(buf).digest("hex"),
      bytes: buf.length,
      verificationOk: result.verification.ok,
      failedChecks: result.verification.checks.filter((c) => !c.ok).map((c) => c.id),
      scenes: p.scenes.map((s) => ({
        id: s.id,
        component: s.spec.componentId,
        mechanism: s.spec.mechanism,
        status: s.validation.status,
        score: Math.round(s.validation.score * 100) / 100,
        durationSec: Math.round((timed.get(s.id)?.durationSec ?? 0) * 100) / 100,
        speechDurationSec: Math.round((timed.get(s.id)?.speechDurationSec ?? 0) * 100) / 100,
      })),
      narrationEngine: p.narration.engineUsed ?? p.narration.engine,
      narrationNote:
        p.narration.engineUsed === "espeak"
          ? "Bu örnekte eSpeak NG (çevrimdışı, robotik) kullanıldı. Chatterbox Multilingual adaptörü üründe mevcut; gerçek Türkçe sentez yalnızca model kurulabildiğinde ve reports/chatterbox-tr.json içinde kanıtlandığında geçerlidir."
          : p.narration.engineUsed === "chatterbox"
            ? "Bu örnekte Chatterbox Multilingual (Türkçe) kullanıldı; model bu makinede gerçekten çalıştı."
            : `Bu örnekte ${p.narration.engineUsed} motoru kullanıldı.`,
      renderSeconds: Math.round((Date.now() - started) / 100) / 10,
      generatedAt: new Date().toISOString(),
    };
    const idx = manifest.findIndex((m) => m.slug === sample.slug);
    if (idx >= 0) manifest[idx] = entry;
    else manifest.push(entry);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    console.log(`\n  ✓ ${videoName} — ${entry.durationSec.toFixed(2)} sn, ${entry.frames} kare, doğrulama ${entry.verificationOk ? "GEÇTİ" : "SORUNLU"}`);
  }
  console.log("\nManifest:", manifestPath);
}

await main();
