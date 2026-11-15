// Geliştirme modu: API (4319) + Vite arayüz (5319).
//   npm run studio
import { spawn } from "node:child_process";

const procs = [];
function run(name, cmd, args, env = {}) {
  const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, ...env }, shell: process.platform === "win32" });
  p.stdout.on("data", (d) => process.stdout.write(`[${name}] ${d}`));
  p.on("exit", (code) => console.log(`[${name}] çıktı (${code})`));
  procs.push(p);
  return p;
}

run("api", process.execPath, ["--import", "tsx", "packages/server/src/index.ts"], { PORT: "4319", HOST: "0.0.0.0" });
setTimeout(() => run("ui", process.platform === "win32" ? "npx.cmd" : "npx", ["vite", "--config", "packages/ui/vite.config.ts"], {}), 1200);

console.log("\n  Nedenmiş Studio (geliştirme)\n  Arayüz: http://127.0.0.1:5319\n  API:    http://127.0.0.1:4319/api/health\n");

const stop = () => {
  for (const p of procs) p.kill("SIGTERM");
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
