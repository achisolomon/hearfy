# HearFy Patient Demo

Investor-grade interactive patient journey based on the pitch-deck visual language.
The brand name is configurable via `BRAND_NAME` in `lib/mock-data.ts`.

## Included
- 27 connected patient screens
- Smart matching intake
- Booking and payment
- Live CMA tracking
- Consent, kit setup, otoscopy and hearing test
- Remote audiologist session
- Results, device recommendation, comparison and checkout
- Order tracking and post-sale care
- Desktop demo navigator

## Run
```bash
cd demo && npm install && npm run dev
```
Open http://localhost:3000

## Checks

```bash
npm test                 # unit + guard tests
npm run typecheck
npm run stability-sweep  # persistent chrome must not move between screens
npm run mobile-sweep     # layout at phone width; BASE_FONT=24 for large text
npm run role-lock-sweep  # no in-screen click may change persona
```

The sweeps drive a real browser and need `npm run dev` running.

## Docs

- [HELD-FRAME-RULE.md](HELD-FRAME-RULE.md) — why persistent chrome must never
  resize, and how to fix it when content varies. Read before changing layout;
  this defect has shipped four times.
- [public/brand/README.md](public/brand/README.md) — standalone logo files for
  use outside the app.

Two dev servers in this directory share one `.next` and will corrupt each
other. Give the second its own build dir: `DIST_DIR=.next-review npx next dev -p 3001`.
