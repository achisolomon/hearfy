# Deploy gate

Why: Cloudflare Pages runs `npm run build`, and npm runs `prebuild` first
(`typecheck && test`). Both are fully deterministic and need nothing
Cloudflare's builder has that this machine doesn't — so neither should ever
be discovered failing only on Cloudflare, after the push already left the
machine. (The full story, and the PDF-export gate that made this necessary
for the deck, is in `hearfy-internal/deck/scripts/DEPLOY-GATE.md`.)

## What runs, and where

1. **Pre-push git hook** (`scripts/hooks/pre-push`, installed by
   `npm run install-hooks`) — runs the same two checks locally, before the
   push leaves the machine. Check-only: unlike the deck repo there is
   nothing here that needs a local browser to regenerate, so a failure just
   blocks the push with the same message Cloudflare would show.

2. **GitHub Actions** (`.github/workflows/demo-verify.yml`) — the backstop
   for a push that skipped the hook (`--no-verify`, a fresh clone, a machine
   without `install-hooks` run). Runs the same two checks.

3. **`npm run watch-deploy`** — polls the Cloudflare Pages API for a
   deployment's outcome and prints the build-log tail on failure. Needs
   `CLOUDFLARE_API_TOKEN` (a token scoped to "Pages: Read") in the
   environment; without it, it explains that and exits. Least important
   layer — everything it would report, the pre-push gate already catches
   first.

## Setup (once per clone)

```bash
cd demo && npm run install-hooks
cp .env.example .env   # then fill in CLOUDFLARE_API_TOKEN — optional, only for watch-deploy
```

To generate the token: Cloudflare dashboard → profile icon → **My Profile** →
**API Tokens** → **Create Token** → **Custom token** → under Permissions add
**Account / Cloudflare Pages / Read** → scope to the Hearfy account → Continue
→ Create Token → copy it into `.env` (it's shown once).

## Bypass

`git push --no-verify` skips the hook. Expect the Cloudflare build (and the
Actions backstop) to fail instead.
