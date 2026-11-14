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

const root = window.document.getElementById("root");
const html = root?.innerHTML ?? "";
const text = root?.textContent ?? "";

const checks = {
  mounted: html.length > 500,
  sidebar: text.includes("Yeni video") && text.includes("Kütüphane"),
  hero: text.includes("kanıtlı") || text.includes("Bir soru yazın"),
  durations: text.includes("30 sn") && text.includes("60 sn"),
};

// Kütüphane ekranı
const goto = async (hash, wait = 900) => {
  window.location.hash = hash;
  window.dispatchEvent(new window.HashChangeEvent("hashchange"));
  await new Promise((r) => setTimeout(r, wait));
  return { html: root?.innerHTML ?? "", text: root?.textContent ?? "" };
};

const lib = await goto("#/library");
checks.library = lib.text.includes("Projeler");

// Stüdyo ekranı (gerçek proje kimliğiyle)
const list = await (await fetch(`/api/projects`)).json();
const projectId = list.projects?.[0]?.id;
if (projectId) {
  const studio = await goto(`#/studio/${projectId}`, 1500);
  checks.studio = studio.text.includes("Zaman çizelgesi") && (studio.text.includes("Seslendir") || studio.text.includes("Sesi yenile"));
  checks.studioScenes = (studio.html.match(/scene-card/g) ?? []).length >= 1;
} else {
  checks.studio = false;
  checks.studioScenes = false;
}

checks.noRuntimeError = errors.length === 0;

console.log("Arayüz duman testi");
for (const [k, v] of Object.entries(checks)) console.log(`  ${v ? "✓" : "✗"} ${k}`);
if (errors.length) console.log("Hatalar:", errors.slice(0, 5));
console.log(`  DOM: ${html.length} bayt`);

process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
