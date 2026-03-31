import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));

let apiProcess = null;
let dashboardProcess = null;
let isShuttingDown = false;

function spawnWorkspaceProcess(name, args) {
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", `corepack pnpm ${args.join(" ")}`], {
          cwd: rootDir,
          stdio: "inherit",
          env: process.env,
        })
      : spawn("corepack", ["pnpm", ...args], {
          cwd: rootDir,
          stdio: "inherit",
          env: process.env,
        });

  child.on("exit", (code, signal) => {
    if (isShuttingDown) {
      return;
    }

    console.error(
      `[dev] ${name} exited unexpectedly${signal ? ` with signal ${signal}` : ` with code ${code ?? 0}`}.`,
    );
    shutdown(code ?? 1);
  });

  child.on("error", (error) => {
    if (isShuttingDown) {
      return;
    }

    console.error(`[dev] Failed to start ${name}.`, error);
    shutdown(1);
  });

  return child;
}

async function waitForApi(url, timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the API server is ready.
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error(`API server did not become ready within ${timeoutMs / 1000} seconds.`);
}

async function isApiReady(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

function terminateProcess(child) {
  if (!child || child.exitCode !== null || child.killed) {
    return;
  }

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }

  child.kill("SIGTERM");
}

function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  terminateProcess(dashboardProcess);
  terminateProcess(apiProcess);
  setTimeout(() => process.exit(exitCode), 150);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("[dev] Starting API server...");
if (await isApiReady("http://127.0.0.1:3001/api/healthz")) {
  console.log("[dev] Reusing existing API server on port 3001.");
} else {
  apiProcess = spawnWorkspaceProcess("API server", ["--filter", "@workspace/api-server", "dev"]);
  await waitForApi("http://127.0.0.1:3001/api/healthz");
  console.log("[dev] API server is ready.");
}

console.log("[dev] Starting dashboard...");
dashboardProcess = spawnWorkspaceProcess("dashboard", ["--filter", "@workspace/healthcare-dashboard", "dev"]);
