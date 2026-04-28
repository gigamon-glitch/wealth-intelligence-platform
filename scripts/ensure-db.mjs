#!/usr/bin/env node
/**
 * Ensures local PostgreSQL (Docker) is up and schema is applied before `next dev`.
 * Google OAuth uses Prisma — without a DB the callback fails with OAuthCallback.
 *
 * Skip: SKIP_DB_ENSURE=1 npm run dev
 */
import { execSync } from "child_process";
import fs from "fs";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadDotEnv() {
  const p = path.join(root, ".env");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function parseDbPort(databaseUrl) {
  const m = databaseUrl.match(/:(\d+)\//);
  if (m) return parseInt(m[1], 10);
  return 5432;
}

function checkPort(host, port) {
  return new Promise((resolve) => {
    const s = net.connect(port, host, () => {
      s.end();
      resolve(true);
    });
    s.on("error", () => resolve(false));
  });
}

async function waitForDb(host, port, ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await checkPort(host, port)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No database on ${host}:${port} after ${ms}ms`);
}

async function main() {
  if (process.env.SKIP_DB_ENSURE === "1" || process.env.CI === "true") {
    console.log("[ensure-db] SKIP_DB_ENSURE set, skipping.");
    return;
  }

  loadDotEnv();
  const databaseUrl = process.env.DATABASE_URL || "";

  if (!databaseUrl.startsWith("postgresql")) {
    console.log("[ensure-db] DATABASE_URL is not PostgreSQL — skipping Docker ensure.");
    return;
  }

  const port = parseDbPort(databaseUrl);
  const host = "127.0.0.1";

  if (await checkPort(host, port)) {
    console.log(`[ensure-db] PostgreSQL already reachable at ${host}:${port}`);
  } else {
    console.log("[ensure-db] Starting PostgreSQL (docker compose up -d)…");
    try {
      execSync("docker compose up -d", { cwd: root, stdio: "inherit" });
    } catch {
      console.error("\n[ensure-db] Could not run Docker Compose.");
      console.error("  Fix: install Docker Desktop, then from this folder run:");
      console.error("    docker compose up -d");
      console.error("    npx prisma db push");
      console.error("  Or set SKIP_DB_ENSURE=1 if you manage Postgres yourself.\n");
      process.exit(1);
    }
    console.log(`[ensure-db] Waiting for ${host}:${port}…`);
    try {
      await waitForDb(host, port, 120_000);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  }

  console.log("[ensure-db] prisma db push");
  execSync("npx prisma db push", { cwd: root, stdio: "inherit" });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
