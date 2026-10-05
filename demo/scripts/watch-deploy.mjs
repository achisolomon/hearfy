#!/usr/bin/env node
/**
 * Watch the Cloudflare Pages deployment for a pushed commit, and report what
 * actually happened to it.
 *
 * This is the BACKSTOP, not the primary defence. The pre-push gate catches the
 * failures that are reproducible locally (typecheck, tests, stale PDFs), which
 * is nearly all of them. What reaches Cloudflare unverified is a `--no-verify`
 * push, a push from a machine without the hook, or a genuine
 * builder-environment failure -- and those are exactly what this surfaces,
 * including the build log tail, so the failure does not sit unnoticed while
 * the site serves the last good build.
 *
 *     npm run watch-deploy                  # newest deployment for this project
 *     npm run watch-deploy -- --commit HEAD # wait for a specific commit's build
 *     npm run watch-deploy -- --project hearfy-deck --once
 *
 * Credentials (never hard-code, never commit):
 *     CLOUDFLARE_API_TOKEN   token with "Cloudflare Pages: Read"
 *     CLOUDFLARE_ACCOUNT_ID  defaults to the Hearfy account below
 *
 * Reads them from a real environment variable if set, otherwise from a
 * gitignored .env next to package.json (see .env.example).
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(path.join(here, "..", ".env"));
} catch {
  /* no .env file — real env vars (e.g. CI secrets) still apply */
}

/** From the dashboard URL Achi shared; overridable by env. */
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || "ed41b34a65186fab21acf05d371841ff";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const BOLD = "[1m", RED = "[31m", GREEN = "[32m";
const YELLOW = "[33m", DIM = "[2m", OFF = "[0m";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const ONCE = process.argv.includes("--once");

/** Guess the Pages project from the repo, so the common case needs no flags. */
function defaultProject() {
  try {
    const remote = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" });
    if (remote.includes("hearfy-internal")) return "hearfy-deck";
    if (remote.includes("hearfy")) return "hearfy";
  } catch { /* not a repo; fall through */ }
  return null;
}

const PROJECT = arg("project", defaultProject());

function resolveCommit(spec) {
  if (!spec) return null;
  try {
    return execFileSync("git", ["rev-parse", spec], { encoding: "utf8" }).trim();
  } catch {
    return spec;
  }
}

async function api(pathname) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const msg = (body.errors || []).map((e) => `${e.code}: ${e.message}`).join("; ")
      || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body.result;
}

/**
 * Cloudflare reports stage-level state (queued → initialize → clone_repo →
 * build → deploy). A failure in ANY stage — not just the final "deploy" one
 * — ends the deployment; the build failure in the screenshot that prompted
 * this script happened in the `build` stage, never reaching `deploy`. So
 * "done" means either the current stage itself failed/was canceled, or the
 * pipeline reached its last stage and finished.
 */
function summarize(d) {
  const stage = d.latest_stage || {};
  const stageFailed = stage.status === "failure" || stage.status === "canceled";
  const pipelineFinished = stage.name === "deploy" && ["success", "failure", "canceled"].includes(stage.status);
  const done = stageFailed || pipelineFinished;
  return { done, failed: stageFailed, stageName: stage.name, stageStatus: stage.status };
}

async function findDeployment(commit) {
  const list = await api(`/accounts/${ACCOUNT}/pages/projects/${PROJECT}/deployments?per_page=25`);
  if (!commit) return list[0] || null;
  return list.find((d) => d.deployment_trigger?.metadata?.commit_hash === commit) || null;
}

async function main() {
  if (!TOKEN) {
    console.error(
      `${YELLOW}CLOUDFLARE_API_TOKEN is not set.${OFF}\n\n`
      + "Create a token with the 'Cloudflare Pages: Read' permission at\n"
      + "  https://dash.cloudflare.com/profile/api-tokens\n"
      + "then put it in the gitignored .env next to package.json:\n\n"
      + `  ${BOLD}CLOUDFLARE_API_TOKEN=...${OFF}   (see .env.example)\n\n`
      + "Until then the pre-push gate is still your protection — it catches\n"
      + "these failures before they ever reach Cloudflare.",
    );
    process.exit(2);
  }
  if (!PROJECT) {
    console.error("Could not infer the Pages project. Pass --project <name>.");
    process.exit(2);
  }

  const commit = resolveCommit(arg("commit"));
  console.error(`${BOLD}Watching Cloudflare Pages: ${PROJECT}${OFF}`);
  if (commit) console.error(`${DIM}commit ${commit.slice(0, 8)}${OFF}`);

  const deadline = Date.now() + 20 * 60_000;
  let deployment = null;
  let lastLine = "";

  while (Date.now() < deadline) {
    try {
      deployment = await findDeployment(commit);
    } catch (error) {
      console.error(`${RED}Cloudflare API error:${OFF} ${error.message}`);
      process.exit(2);
    }

    if (!deployment) {
      if (ONCE) {
        console.error("No deployment found yet for that commit.");
        process.exit(3);
      }
      process.stderr.write(`${DIM}waiting for a deployment to appear…${OFF}\r`);
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    const { done, failed, stageName, stageStatus } = summarize(deployment);
    const line = `${stageName}: ${stageStatus}`;
    if (line !== lastLine) {
      console.error(`${DIM}  ${line}${OFF}`);
      lastLine = line;
    }

    if (done || ONCE) {
      const url = `https://dash.cloudflare.com/${ACCOUNT}/pages/view/${PROJECT}/${deployment.id}`;
      if (failed) {
        console.error(`\n${RED}${BOLD}Deploy FAILED${OFF} — ${deployment.url || ""}`);
        console.error(`${DIM}${url}${OFF}`);
        const logs = await api(
          `/accounts/${ACCOUNT}/pages/projects/${PROJECT}/deployments/${deployment.id}/history/logs`,
        ).catch(() => null);
        const lines = logs?.data?.map((l) => l.line) || [];
        if (lines.length) {
          console.error(`\n${BOLD}Build log (tail):${OFF}`);
          for (const l of lines.slice(-30)) console.error("    " + l);
        }
        process.exit(1);
      }
      if (done) {
        console.error(`\n${GREEN}${BOLD}Deploy succeeded${OFF} — ${deployment.url || ""}`);
        process.exit(0);
      }
      console.error(`\n${YELLOW}Still in progress${OFF} (--once). ${url}`);
      process.exit(0);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }

  console.error(`\n${YELLOW}Timed out after 20 minutes.${OFF}`);
  process.exit(3);
}

main().catch((error) => {
  console.error(`${RED}watch-deploy crashed:${OFF} ${error?.stack || error}`);
  process.exit(2);
});
