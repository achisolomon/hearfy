#!/usr/bin/env node
/**
 * Install the pre-push gate into this repository's git hooks.
 *
 * Hooks are written to the repo's COMMON git dir (`git rev-parse
 * --git-common-dir`), not the per-worktree one, so a single install covers
 * every session worktree this project creates — including ones that do not
 * exist yet.
 *
 *     npm run install-hooks
 *     npm run install-hooks -- --force   # overwrite a foreign existing hook
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(here, "hooks", "pre-push");
const MARKER = "Hearfy pre-push gate";
const force = process.argv.includes("--force");

const git = (...args) =>
  execFileSync("git", args, { cwd: here, encoding: "utf8" }).trim();

const commonDir = path.resolve(here, git("rev-parse", "--git-common-dir"));

/** `git config --get` exits 1 when the key is simply unset — that is not an error. */
function gitConfig(key) {
  try {
    return git("config", "--get", key);
  } catch {
    return "";
  }
}

const hooksPath = gitConfig("core.hooksPath");
if (hooksPath) {
  console.error(
    `! core.hooksPath is set to '${hooksPath}'.\n`
    + "  git will read hooks from there, so installing into the default\n"
    + "  hooks dir would have no effect. Unset it, or copy the hook yourself.",
  );
  process.exit(1);
}

const hooksDir = path.join(commonDir, "hooks");
fs.mkdirSync(hooksDir, { recursive: true });
const target = path.join(hooksDir, "pre-push");

if (fs.existsSync(target)) {
  const existing = fs.readFileSync(target, "utf8");
  if (!existing.includes(MARKER) && !force) {
    console.error(
      `! ${target} already exists and is not ours.\n`
      + "  Refusing to clobber it. Re-run with --force to replace it.",
    );
    process.exit(1);
  }
}

fs.copyFileSync(SOURCE, target);
fs.chmodSync(target, 0o755);
console.log(`✓ pre-push gate installed at ${target}`);
console.log("  It covers every worktree of this repo. Bypass with --no-verify.");
