// Nedenmiş Studio — Electron ana süreç.
// Yerel API/üretim sunucusunu (Node) başlatır, arayüzü kendi penceresinde gösterir.
//
// Kurulu uygulamada çalışma zamanı bağımlılıkları `resources/node_modules` altındadır
// (electron-builder `extraResources`). Uygulama açılmadan ÖNCE bunlar doğrulanır;
// eksikse belirsiz bir "servis başlamadı" penceresi yerine tam modül adı gösterilir.
//
//   Nedenmiş Studio.exe                     → normal uygulama
//   Nedenmiş Studio.exe --self-test         → kurulu uygulamanın kendi kendini testi
//   Nedenmiş Studio.exe --self-test --report C:\rapor.json
const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { pathToFileURL } = require("node:url");
const { execFile } = require("node:child_process");

const APP_NAME = "Nedenmiş Studio";
let mainWindow = null;
let studioServer = null;
let serverPort = 0;
let shuttingDown = false;

const SELF_TEST = process.argv.includes("--self-test");
const reportIndex = process.argv.indexOf("--report");
const SELF_TEST_REPORT =
  reportIndex > -1 && process.argv[reportIndex + 1] ? process.argv[reportIndex + 1] : path.join(os.tmpdir(), "nedenmis-self-test.json");
const SELFTEST_TOPIC = "Elmas neden kolay kırılmaz?";
const SELFTEST_SECONDS = Number(process.env.NEDENMIS_SELFTEST_SECONDS ?? 30);

process.env.NEDENMIS_RESOURCES = process.resourcesPath;
process.env.NEDENMIS_VERSION = app.getVersion();

if (process.platform === "win32") app.setAppUserModelId("com.nedenmis.studio");

function logPath() {
  const dir = path.join(app.getPath("userData"), "logs");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "studio.log");
}

function log(message) {
  try {
    fs.appendFileSync(logPath(), `[${new Date().toISOString()}] ${message}\n`);
  } catch {
    /* yok say */
  }
  if (SELF_TEST) console.log(`[studio] ${message}`);
}

function exeName(base) {
  return process.platform === "win32" ? `${base}.exe` : base;
}

/** Kurulu uygulamanın çalışma zamanı dosyalarının beklenen yerleri. */
function runtimePaths() {
  const res = process.resourcesPath;
  return {
    resources: res,
    app: __dirname,
    server: path.join(__dirname, "server.mjs"),
    ui: path.join(__dirname, "ui", "index.html"),
    ffmpeg: path.join(res, "bin", exeName("ffmpeg")),
    ffprobe: path.join(res, "bin", exeName("ffprobe")),
    python: path.join(res, "python", exeName("python")),
    fonts: path.join(res, "fonts", "DejaVuSans.ttf"),
    espeakBridge: path.join(res, "scripts", "espeak_bridge.py"),
    licenses: path.join(res, "LICENSES.txt"),
  };
}

function run(cmd, args, timeoutMs = 20000) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: timeoutMs, windowsHide: true }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        code: error ? (typeof error.code === "number" ? error.code : -1) : 0,
        stdout: String(stdout ?? "").trim(),
        stderr: String(stderr ?? "").trim(),
      });
    });
  });
}

/**
 * @resvg/resvg-js ve native eklentisini gerçekten yükler.
 * Electron ana süreci de sunucu da aynı çözümlemeyi kullanır; burada yapılan kontrol
 * "paket gerçekten kurulu uygulamanın içinden mi geliyor" sorusunu yanıtlar.
 */
function checkResvg() {
  const out = { ok: false, resolved: null, fromResources: false, version: null, nativePackage: null, renderBytes: 0, error: null };
  try {
    out.resolved = require.resolve("@resvg/resvg-js");
    out.fromResources = path.resolve(out.resolved).startsWith(path.resolve(process.resourcesPath) + path.sep);
    const pkgDir = path.dirname(out.resolved);
    try {
      out.version = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8")).version;
    } catch {
      /* sürüm okunamazsa sorun değil */
    }
    const platformPkg = `@resvg/resvg-js-${process.platform}-${process.arch}`;
    const candidates = [platformPkg, `${platformPkg}-msvc`, `${platformPkg}-gnu`, `${platformPkg}-musl`];
    for (const candidate of candidates) {
      try {
        out.nativePackage = { name: candidate, resolved: require.resolve(candidate) };
        break;
      } catch {
        /* sıradaki */
      }
    }
    const { Resvg } = require("@resvg/resvg-js");
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#0b1220"/><circle cx="32" cy="32" r="18" fill="#e0b34a"/></svg>';
    out.renderBytes = new Resvg(svg, { fitTo: { mode: "width", value: 64 } }).render().asPng().length;
    out.ok = out.renderBytes > 500 && out.fromResources;
    if (!out.fromResources) out.error = `@resvg/resvg-js paket dışından çözümlendi: ${out.resolved}`;
  } catch (e) {
    out.error = e && e.message ? e.message : String(e);
  }
  return out;
}

/** Tüm zorunlu çalışma zamanı bileşenlerini (dosya düzeyinde) doğrular. */
function checkRuntime() {
  const p = runtimePaths();
  const checks = [];
  const add = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });

  const resvg = checkResvg();
  add(
    "resvg_module",
    resvg.ok,
    resvg.ok
      ? `${resvg.resolved} (v${resvg.version ?? "?"}) — resources içinden, ${resvg.renderBytes} bayt PNG üretildi`
      : resvg.error ?? "yüklenemedi",
  );
  add(
    "resvg_native",
    resvg.renderBytes > 500,
    resvg.nativePackage ? `${resvg.nativePackage.name} → ${resvg.nativePackage.resolved}` : "platform native paketi bulunamadı",
  );

  for (const [id, file] of [
    ["server_bundle", p.server],
    ["ui_bundle", p.ui],
    ["ffmpeg", p.ffmpeg],
    ["ffprobe", p.ffprobe],
    ["python", p.python],
    ["fonts", p.fonts],
    ["espeak_bridge", p.espeakBridge],
  ]) {
    add(id, fs.existsSync(file), file);
  }

  const failures = checks.filter((c) => !c.ok);
  return { checks, failures, resvg, paths: p };
}

function missingDependencyMessage(result) {
  const missing = result.failures.map((f) => `• ${f.id}: ${f.detail}`).join("\n");
  return `Gerekli çalışma zamanı bileşenleri eksik:\n\n${missing}\n\nUygulamayı yeniden kurun (kurulum dosyası eksik paketlenmiş olabilir).\nGünlük: ${logPath()}`;
}

async function startServer() {
  const serverFile = path.join(__dirname, "server.mjs");
  if (!fs.existsSync(serverFile)) throw new Error(`Sunucu paketi bulunamadı: ${serverFile}`);
  const mod = await import(pathToFileURL(serverFile).href);
  const dataDir = process.env.NEDENMIS_DATA || path.join(app.getPath("userData"), "data");
  const uiDir = path.join(__dirname, "ui");
  studioServer = mod.createStudioServer({
    dataDir,
    uiDir,
    version: app.getVersion(),
    host: "127.0.0.1",
    port: 0,
  });
  const { port } = await studioServer.listen(0, "127.0.0.1");
  serverPort = port;
  log(`Sunucu hazır: http://127.0.0.1:${port} (veri: ${dataDir}, db: ${studioServer.store.backend})`);
  return port;
}

function buildMenu() {
  const template = [
    {
      label: "Dosya",
      submenu: [
        { label: "Yeni video", accelerator: "CmdOrCtrl+N", click: () => mainWindow?.loadURL(`http://127.0.0.1:${serverPort}/#/new`) },
        { label: "Kütüphane", accelerator: "CmdOrCtrl+L", click: () => mainWindow?.loadURL(`http://127.0.0.1:${serverPort}/#/library`) },
        { type: "separator" },
        { label: "Çıktı klasörünü aç", click: () => shell.openPath(path.join(app.getPath("userData"), "data", "projects")) },
        { label: "Günlük dosyasını aç", click: () => shell.openPath(logPath()) },
        { type: "separator" },
        { label: "Çıkış", role: "quit" },
      ],
    },
    {
      label: "Görünüm",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Yardım",
      submenu: [
        {
          label: `Hakkında — ${APP_NAME}`,
          click: () =>
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: APP_NAME,
              message: `${APP_NAME} ${app.getVersion()}`,
              detail:
                "Bilimsel doğruluk odaklı Türkçe kısa video stüdyosu.\n\n" +
                "• Konu → doğrulanmış bilgi kartı → senaryo → sahne planı\n" +
                "• Sahne bazlı görsel doğrulama ve reddetme\n" +
                "• Ölçülen ses süresine göre zamanlama, FFprobe doğrulaması\n\n" +
                "Sesler: eSpeak NG (çevrimdışı) veya Chatterbox Multilingual.",
            }),
        },
        { label: "Açık kaynak lisansları", click: () => shell.openPath(path.join(process.resourcesPath, "LICENSES.txt")) },
        { label: "Proje sayfası", click: () => shell.openExternal("https://github.com/buraksungr/nedenmis-2") },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: "#05080f",
    show: false,
    title: APP_NAME,
    autoHideMenuBar: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://127.0.0.1")) return { action: "allow" };
    void shell.openExternal(url);
    return { action: "deny" };
  });

  try {
    // Sunucudan önce bağımlılık kontrolü: eksikse anlaşılır hata göster.
    const runtime = checkRuntime();
    if (runtime.failures.length) {
      log(`Çalışma zamanı eksik: ${runtime.failures.map((f) => f.id).join(", ")}`);
      await dialog.showMessageBox(mainWindow, {
        type: "error",
        title: `${APP_NAME} başlatılamadı`,
        message: "Gerekli bileşenler eksik.",
        detail: missingDependencyMessage(runtime),
        buttons: ["Kapat"],
      });
      app.quit();
      return;
    }

    await startServer();
    await mainWindow.loadURL(`http://127.0.0.1:${serverPort}/#/new`);
    log("Arayüz yüklendi");
  } catch (e) {
    log(`Başlatma hatası: ${e && e.stack ? e.stack : e}`);
    await dialog.showMessageBox(mainWindow, {
      type: "error",
      title: `${APP_NAME} başlatılamadı`,
      message: "Yerel üretim servisi başlatılamadı.",
      detail: `${e && e.message ? e.message : e}\n\nGünlük: ${logPath()}`,
      buttons: ["Kapat"],
    });
    app.quit();
  }
}

// ---------------------------------------------------------------------------
// --self-test: kurulu uygulamanın kendi kendini testi (pencere açmaz).
// Kurulum sonrası gerçek Windows makinesinde/CI'da çalışır; repodaki node_modules
// kullanılmaz — her şey kurulum klasöründen çözümlenir.
// ---------------------------------------------------------------------------
async function apiJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${url} → HTTP ${res.status}: ${text.slice(0, 300)}`);
  return body;
}

async function waitJob(base, jobId, timeoutMs = 25 * 60 * 1000) {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeoutMs) {
    const { job } = await apiJson(`${base}/api/jobs/${jobId}`);
    if (!last || job.stage !== last) {
      last = job.stage;
      log(`  iş ${job.kind}: ${job.status} ${Math.round((job.progress ?? 0) * 100)}% ${job.message ?? ""}`.trim());
    }
    if (job.status === "done") return job;
    if (job.status === "failed") throw new Error(`İş başarısız (${job.kind}): ${job.error ?? "bilinmeyen hata"}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`İş zaman aşımına uğradı (${jobId})`);
}

async function runSelfTest() {
  const started = Date.now();
  const report = {
    at: new Date().toISOString(),
    version: app.getVersion(),
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
    platform: process.platform,
    arch: process.arch,
    packaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    appPath: app.getAppPath(),
    topic: SELFTEST_TOPIC,
    targetDurationSec: SELFTEST_SECONDS,
    runtime: null,
    tools: {},
    server: null,
    project: null,
    render: null,
    failures: [],
    ok: false,
  };

  const fail = (what, error) => {
    const message = error && error.message ? error.message : String(error);
    report.failures.push(`${what}: ${message}`);
    log(`BAŞARISIZ — ${what}: ${message}`);
  };

  try {
    log(`Kendi kendini test başladı — ${APP_NAME} ${report.version} (${report.platform}/${report.arch})`);

    // 1) Çalışma zamanı dosyaları + resvg (native eklenti gerçekten yükleniyor mu?)
    const runtime = checkRuntime();
    report.runtime = {
      checks: runtime.checks,
      resvg: { ...runtime.resvg },
    };
    for (const f of runtime.failures) fail(`çalışma zamanı (${f.id})`, f.detail);
    log(`resvg: ${runtime.resvg.resolved} (resources içinden: ${runtime.resvg.fromResources})`);

    // 2) Harici araçlar gerçekten çalışıyor mu?
    const p = runtime.paths;
    if (fs.existsSync(p.ffmpeg)) {
      const r = await run(p.ffmpeg, ["-version"]);
      report.tools.ffmpeg = { path: p.ffmpeg, ok: r.ok, version: r.stdout.split("\n")[0] ?? "", error: r.ok ? null : r.stderr };
      if (!r.ok) fail("ffmpeg", r.stderr || "çalıştırılamadı");
    }
    if (fs.existsSync(p.ffprobe)) {
      const r = await run(p.ffprobe, ["-version"]);
      report.tools.ffprobe = { path: p.ffprobe, ok: r.ok, version: r.stdout.split("\n")[0] ?? "", error: r.ok ? null : r.stderr };
      if (!r.ok) fail("ffprobe", r.stderr || "çalıştırılamadı");
    }
    if (fs.existsSync(p.python)) {
      const r = await run(p.python, ["-c", "import sys; print(sys.version.split()[0])"]);
      report.tools.python = { path: p.python, ok: r.ok, version: r.stdout, error: r.ok ? null : r.stderr };
      if (!r.ok) fail("python", r.stderr || "çalıştırılamadı");
      const e = await run(p.python, ["-c", "import espeakng_loader; print(espeakng_loader.get_library_path())"]);
      report.tools.espeak = { ok: e.ok, library: e.stdout, error: e.ok ? null : e.stderr };
      if (!e.ok) log(`UYARI — eSpeak kitaplığı Python'dan okunamadı: ${e.stderr.slice(0, 200)}`);
    }
    report.tools.fonts = { path: p.fonts, ok: fs.existsSync(p.fonts) };

    // 3) Sunucu
    const dataDir = process.env.NEDENMIS_DATA || path.join(app.getPath("userData"), "self-test-data");
    fs.mkdirSync(dataDir, { recursive: true });
    process.env.NEDENMIS_DATA = dataDir;
    const port = await startServer();
    const base = `http://127.0.0.1:${port}`;
    const health = await apiJson(`${base}/api/health`);
    report.server = { url: base, ok: Boolean(health.ok), db: health.db, dataDir };
    if (!health.ok) fail("sunucu", "health ok değil");

    // 4) Proje oluştur → seslendir → render et
    const created = await apiJson(`${base}/api/projects`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic: SELFTEST_TOPIC, targetDurationSec: SELFTEST_SECONDS, quality: "draft" }),
    });
    const project = created.project;
    report.project = { id: project.id, title: project.title, cardId: project.research?.cardId, scenes: project.scenes.length };
    log(`proje: ${project.title} (${project.scenes.length} sahne, kart: ${project.research?.cardId})`);

    const narrateJob = await apiJson(`${base}/api/projects/${project.id}/narrate`, { method: "POST" });
    await waitJob(base, narrateJob.job.id);

    const renderJob = await apiJson(`${base}/api/projects/${project.id}/render`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quality: "draft" }),
    });
    const done = await waitJob(base, renderJob.job.id);

    const { project: finished } = await apiJson(`${base}/api/projects/${project.id}`);
    const videoPath = finished.outputs?.videoPath;
    report.render = {
      jobId: done.id,
      videoPath,
      exists: Boolean(videoPath && fs.existsSync(videoPath)),
      bytes: videoPath && fs.existsSync(videoPath) ? fs.statSync(videoPath).size : 0,
      engineUsed: finished.narration?.engineUsed ?? null,
      durationSec: finished.timelineMeta?.durationSec ?? null,
      scenes: finished.scenes.map((s) => ({ id: s.id, component: s.spec?.componentId, status: s.validation?.status })),
    };
    if (!report.render.exists) fail("video", `çıktı dosyası yok: ${videoPath}`);

    // 5) FFprobe ile bağımsız doğrulama
    if (report.render.exists && fs.existsSync(p.ffprobe)) {
      const probe = await run(p.ffprobe, [
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        "-count_frames",
        "-select_streams",
        "v:0",
        videoPath,
      ], 120000);
      const audioProbe = await run(p.ffprobe, ["-v", "error", "-print_format", "json", "-show_streams", "-select_streams", "a:0", videoPath], 60000);
      const parsed = probe.ok ? JSON.parse(probe.stdout) : { streams: [], format: {} };
      const audio = audioProbe.ok ? (JSON.parse(audioProbe.stdout).streams?.[0] ?? {}) : {};
      const v = parsed.streams?.[0] ?? {};
      report.render.ffprobe = {
        ok: probe.ok,
        codec: v.codec_name,
        width: v.width,
        height: v.height,
        fps: v.avg_frame_rate,
        framesRead: Number(v.nb_read_frames ?? 0),
        durationSec: Number(parsed.format?.duration ?? 0),
        audioCodec: audio.codec_name,
        audioSampleRate: Number(audio.sample_rate ?? 0),
        error: probe.ok ? null : probe.stderr,
      };
      if (!probe.ok) fail("ffprobe", probe.stderr || "okunamadı");
      if (v.codec_name !== "h264") fail("kodek", `video kodeği h264 değil: ${v.codec_name}`);
      if (audio.codec_name !== "aac") fail("kodek", `ses kodeği aac değil: ${audio.codec_name}`);
      if (Number(parsed.format?.duration ?? 0) < 10) fail("süre", `video çok kısa: ${parsed.format?.duration} sn`);
    }

    // 6) Sunucunun kendi doğrulaması.
    // Draft kalitesinde 540×960 üretilir; "resolution_1080x1920" bu yüzden uyarıdır.
    // Seslendirme motoru "silent" ise (TTS yoksa) süre hedefi anlamını yitirir.
    const verification = finished.verification ?? finished.outputs?.verification ?? null;
    if (verification) {
      const failed = (verification.checks ?? []).filter((c) => !c.ok).map((c) => c.id);
      const engine = finished.narration?.engineUsed ?? null;
      const tolerated = new Set(["resolution_1080x1920"]);
      if (engine === "silent") tolerated.add("duration_matches_target");
      const hard = failed.filter((id) => !tolerated.has(id));
      report.render.verificationOk = Boolean(verification.ok);
      report.render.failedChecks = failed;
      report.render.toleratedChecks = failed.filter((id) => tolerated.has(id));
      report.render.engineUsed = engine;
      if (hard.length) fail("doğrulama", `başarısız kontroller: ${hard.join(", ")}`);
      if (failed.length) log(`doğrulama uyarıları (kabul edilen): ${failed.join(", ")}`);
    } else {
      report.render.verificationOk = null;
      log("UYARI — proje doğrulama raporu içermiyor.");
    }
  } catch (e) {
    fail("genel", e);
    log(`HATA: ${e && e.stack ? e.stack : e}`);
  } finally {
    if (studioServer) {
      try {
        await studioServer.close();
      } catch {
        /* yok say */
      }
    }
  }

  report.ok = report.failures.length === 0;
  report.elapsedSec = Math.round((Date.now() - started) / 100) / 10;
  try {
    fs.mkdirSync(path.dirname(SELF_TEST_REPORT), { recursive: true });
    fs.writeFileSync(SELF_TEST_REPORT, JSON.stringify(report, null, 2), "utf8");
  } catch (e) {
    console.error("Rapor yazılamadı:", e.message);
  }
  console.log(`\n===SELF-TEST-BEGIN===\n${JSON.stringify(report, null, 2)}\n===SELF-TEST-END===`);
  console.log(`${report.ok ? "BAŞARILI" : "BAŞARISIZ"} — ${report.elapsedSec} sn, rapor: ${SELF_TEST_REPORT}`);
  return report.ok ? 0 : 1;
}

process.on("uncaughtException", (e) => {
  log(`Yakalanmamış hata: ${e && e.stack ? e.stack : e}`);
  if (SELF_TEST) {
    console.error("Yakalanmamış hata:", e);
    app.exit(1);
  }
});

if (SELF_TEST) {
  app.disableHardwareAcceleration();
  app.whenReady().then(async () => {
    let code = 1;
    try {
      code = await runSelfTest();
    } catch (e) {
      console.error("Kendi kendini test çöktü:", e);
      code = 1;
    }
    app.exit(code);
  });
} else {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
  } else {
    app.on("second-instance", () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
    app.whenReady().then(async () => {
      buildMenu();
      await createWindow();
      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) void createWindow();
      });
    });
  }
}

app.on("window-all-closed", () => {
  if (SELF_TEST) return;
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", (event) => {
  if (shuttingDown || !studioServer) return;
  shuttingDown = true;
  event.preventDefault();
  studioServer
    .close()
    .catch(() => undefined)
    .finally(() => app.quit());
});
