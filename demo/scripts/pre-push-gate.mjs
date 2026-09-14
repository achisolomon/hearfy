#!/usr/bin/env node
/**
 * Run, on this machine, the exact checks Cloudflare will run after the push.
 *
 * Cloudflare Pages builds with `npm run build`, and npm runs `prebuild` first:
 *
 *     prebuild = typecheck && test
 *
 * Both are fully deterministic and need nothing Cloudflare's builder lacks —
 * so there is no reason either should ever be discovered failing only on
 * Cloudflare, after the push already left the machine. Unlike the deck repo,
 * there is no PDF-export step here that needs a local browser to fix, so this
 * gate is check-only: it runs the same two commands and reports pass/fail.
 *
 * Usage:
 *     node scripts/pre-push-gate.mjs
 *
 * Exit 0 = safe to push. Non-zero = the push is aborted.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(here, "..");

const BOLD = "[1m", RED = "[31m", GREEN = "[32m", DIM = "[2m", OFF = "[0m";
const say = (m = "") => process.stderr.write(m + "\n");
const step = (m) => say(`${BOLD}▸ ${m}${OFF}`);
const ok = (m) => say(`  ${GREEN}✓${OFF} ${m}`);
const bad = (m) => say(`  ${RED}✗${OFF} ${m}`);

function run(cmd, args, opts = {}) {
  try {
    const output = execFileSync(cmd, args, {
      cwd: APP_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...opts,
    });
    return { ok: true, output };
  } catch (error) {
    const output = `${error.stdout || ""}${error.stderr || ""}` || String(error.message || error);
    return { ok: false, output };
  }
}

function tail(text, lines = 40) {
  const all = String(text).trimEnd().split("\n");
  const cut = all.slice(-lines);
  if (all.length > lines) cut.unshift(`${DIM}… ${all.length - lines} earlier lines omitted${OFF}`);
  return cut.map((l) => "    " + l).join("\n");
}

function main() {
  say();
  say(`${BOLD}Pre-push gate — demo (mirrors Cloudflare's prebuild)${OFF}`);
  say(`${DIM}typecheck → test${OFF}`);
  say();

  step("Typecheck");
  const tc = run("npm", ["run", "--silent", "typecheck"], { timeout: 600_000 });
  if (!tc.ok) {
    bad("typecheck failed — Cloudflare would fail here too");
    say(tail(tc.output));
    return 1;
  }
  ok("no type errors");

  step("Tests");
  const tests = run("npm", ["test", "--silent"], {
    timeout: 900_000,
    env: { ...process.env, CI: "1" },
  });
  if (!tests.ok) {
    bad("tests failed — Cloudflare would fail here too");
    say(tail(tests.output));
    return 1;
  }
  ok("test suite passed");

  say();
  say(`${GREEN}${BOLD}Gate green — pushing.${OFF}`);
  say();
  return 0;
}

process.exit(main());
