// Nedenmiş Studio — Electron ana süreç.
// Yerel API/üretim sunucusunu (Node) başlatır, arayüzü kendi penceresinde gösterir.
const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const APP_NAME = "Nedenmiş Studio";
let mainWindow = null;
let studioServer = null;
let serverPort = 0;
let shuttingDown = false;

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

app.on("window-all-closed", () => {
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
