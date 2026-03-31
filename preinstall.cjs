const fs = require("node:fs");
const path = require("node:path");

for (const lockfile of ["package-lock.json", "yarn.lock"]) {
  const target = path.join(__dirname, lockfile);

  try {
    fs.rmSync(target, { force: true });
  } catch {}
}

const userAgent = process.env.npm_config_user_agent ?? "";

if (!userAgent.startsWith("pnpm/")) {
  console.error("Use pnpm instead");
  process.exit(1);
}
