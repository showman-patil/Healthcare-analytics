import { execFileSync } from "node:child_process";

process.env.NODE_ENV ??= "development";
process.env.PORT ??= "3001";

execFileSync(process.execPath, ["./build.mjs"], { stdio: "inherit" });
await import("./dist/index.mjs");
