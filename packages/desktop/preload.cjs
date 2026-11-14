// Preload: arayüz yalnızca okunabilir sürüm bilgisi alır (nodeIntegration kapalı).
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("nedenmis", {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
