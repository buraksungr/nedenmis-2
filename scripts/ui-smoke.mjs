/**
 * Arayüz duman testi: gerçek API'ye karşı, jsdom içinde derlenmiş paketi çalıştırır.
 *   node scripts/ui-smoke.mjs
 *
 * Amaç: arayüzün çalışma zamanında çökmediğini ve beklenen ekran öğelerini
 * (kenar çubuğu, konu girişi, süre çipleri) ürettiğini doğrulamak.
 * Görsel düzen doğrulaması değildir — bu, tarayıcı gerektirir.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const base = process.env.NEDENMIS_API ?? "http://127.0.0.1:4319";
const distDir = path.join(process.cwd(), "packages", "ui", "dist");
const assets = fs.readdirSync(path.join(distDir, "assets"));
const entry = assets.find((f) => f.endsWith(".js"));
if (!entry) throw new Error("Derlenmiş arayüz bulunamadı — npm run build");

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: `${base}/#/new`,
  pretendToBeVisual: true,
  runScripts: "outside-only",
});

const { window } = dom;
const errors = [];
window.addEventListener("error", (e) => errors.push(String(e.message ?? e)));
window.addEventListener("unhandledrejection", (e) => errors.push(String(e.reason ?? e)));

const nativeFetch = globalThis.fetch;
globalThis.window = window;
globalThis.document = window.document;
Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
globalThis.HTMLElement = window.HTMLElement;
globalThis.Node = window.Node;
globalThis.Event = window.Event;
globalThis.CustomEvent = window.CustomEvent;
globalThis.MutationObserver = window.MutationObserver;
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.fetch = (url, init) => nativeFetch(url.startsWith("http") ? url : `${base}${url}`, init);
window.fetch = globalThis.fetch;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
globalThis.IS_REACT_ACT_ENVIRONMENT = false;

await import(pathToFileURL(path.join(distDir, "assets", entry)).href);
await new Promise((r) => setTimeout(r, 1200));

/** Derlenmiş CSS'te renkli (doygun) ton var mı? Tek renk kuralını ölçer. */
function monochromeCss() {
  const cssFile = assets.find((f) => f.endsWith(".css"));
  if (!cssFile) return false;
  const css = fs.readFileSync(path.join(distDir, "assets", cssFile), "utf8");
  const colors = css.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) ?? [];
  const colorful = [];
  for (const raw of colors) {
    let r, g, b;
    if (raw.startsWith("#")) {
      const hex = raw.slice(1);
      if (hex.length === 3) [r, g, b] = [...hex].map((c) => parseInt(c + c, 16));
      else if (hex.length >= 6) [r, g, b] = [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map((c) => parseInt(c, 16));
      else continue;
    } else {
      const nums = raw.match(/[\d.]+/g) ?? [];
      if (nums.length < 3) continue;
      [r, g, b] = nums.slice(0, 3).map(Number);
    }
    if ([r, g, b].some((v) => !Number.isFinite(v))) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat > 0.15) colorful.push(raw);
  }
  if (colorful.length) console.log(`  renkli tonlar: ${[...new Set(colorful)].slice(0, 8).join(", ")}`);
  return colorful.length === 0;
}

const root = window.document.getElementById("root");
const html = root?.innerHTML ?? "";
const text = root?.textContent ?? "";

const checks = {
  mounted: html.length > 500,
  // Yeni menü: Projeler / Video oluştur / Stüdyo / Ayarlar
  sidebar: ["Projeler", "Video oluştur", "Stüdyo", "Ayarlar"].every((label) => text.includes(label)),
  hero: text.includes("kanıtlı") || text.includes("Bir soru yazın"),
  durations: text.includes("30 sn") && text.includes("45 sn"),
  // Yeni içerik kimliği: dil düzeyi seçici (varsayılan Sade)
  languageLevels: text.includes("Sade") && text.includes("Standart") && text.includes("Ayrıntılı"),
  // Tek renk tema: stil dosyasında doygunluğu yüksek (renkli) ton bulunmamalı.
  monochrome: monochromeCss(),
};

// Kütüphane ekranı
const goto = async (hash, wait = 900) => {
  window.location.hash = hash;
  window.dispatchEvent(new window.HashChangeEvent("hashchange"));
  await new Promise((r) => setTimeout(r, wait));
  return { html: root?.innerHTML ?? "", text: root?.textContent ?? "" };
};

let list = await (await fetch(`/api/projects`)).json();
let projectId = list.projects?.[0]?.id;
let seeded = false;

// Boş kütüphanede (CI'da her zaman böyledir) gerçek bir plan oluşturup stüdyoyu
// yine de test ediyoruz; aksi halde test boş veri yüzünden yanlış yere kırmızı yanar.
if (!projectId) {
  const res = await fetch(`/api/projects`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ topic: "Elmas neden kolay kırılmaz?", targetDurationSec: 30, quality: "draft" }),
  });
  if (res.ok) {
    const created = await res.json();
    projectId = created.project?.id;
    seeded = Boolean(projectId);
    list = await (await fetch(`/api/projects`)).json();
  } else {
    console.log(`  ! kütüphane boş ve plan oluşturulamadı (HTTP ${res.status})`);
  }
}

// Kütüphane ekranı (plan oluşturulduktan sonra)
const lib = await goto("#/library");
checks.library = lib.text.includes("Projeler");
if (seeded) checks.seeded = (list.projects ?? []).some((p) => p.id === projectId);

// Stüdyo ekranı (gerçek proje kimliğiyle)
if (projectId) {
  const studio = await goto(`#/studio/${projectId}`, 1500);
  checks.studio = studio.text.includes("Zaman çizelgesi") && (studio.text.includes("Seslendir") || studio.text.includes("Sesi yenile"));
  checks.studioScenes = (studio.html.match(/scene-card/g) ?? []).length >= 1;
} else {
  checks.studio = false;
  checks.studioScenes = false;
}

// Ayarlar ekranı: 9 ayarın tamamı ve motor durumları görünmeli.
const settings = await goto("#/settings", 1200);
checks.settings = [
  "Dil karmaşıklığı",
  "Hedef süre",
  "Görsel karmaşıklık",
  "Altyazı",
  "Dışa aktarma kalitesi",
  "En-boy oranı",
  "Motor",
  "Ses / konuşmacı",
  "Ses önizlemesi",
].every((label) => settings.text.includes(label));
checks.engineStates = settings.text.includes("Chatterbox") && /hazır|kullanılamıyor|indiriliyor/.test(settings.text);

// Stüdyo kalite paneli: senaryo ölçümü görünmeli.
if (projectId) {
  const studio2 = await goto(`#/studio/${projectId}`, 1500);
  checks.scriptQuality = studio2.text.includes("Senaryo kalitesi") && /\d+\/100/.test(studio2.text);
} else {
  checks.scriptQuality = false;
}

checks.noRuntimeError = errors.length === 0;

console.log("Arayüz duman testi");
for (const [k, v] of Object.entries(checks)) console.log(`  ${v ? "✓" : "✗"} ${k}`);
if (errors.length) console.log("Hatalar:", errors.slice(0, 5));
console.log(`  DOM: ${html.length} bayt`);

process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
