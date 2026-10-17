# Thinking slider visual regression evidence

Base: agentscope-ai/QwenPaw `697aeb669f42f223d060772eb7a313eec78ebd20`.
Fix: `701554d7` (`fix(console): fill thinking slider up to selected strength`).

This evidence branch is separate from the PR code branch. The PR changes only
ThinkingControl.tsx and thinking.module.less; these screenshots and the local
fixture are not production files or additional application dependencies.

## What was checked

- The baseline component uses a full-width gradient rail and a transparent track.
- The fixed component fills 1/3 for low, 2/3 for medium, 1 for high, 0 for off.
- Numeric budgets retain partial fill, End/Home behavior, and off-to-minimum navigation.
- Both `qwenpaw` and `ant` class prefixes work.
- Hover does not recolor the unselected rail.
- The compact control retains its 10px rail.
- Unresolved defaults hide the fill and thumb, rather than implying a known strength.
- The rail and track stay distinct in dark mode.

`result.json` contains browser-measured widths, computed colors, and assertions.
All screenshots render the actual official ThinkingControl component with fixture
values; no model, API credentials, backend, or user/business data is involved.
`fixture/Before.tsx` and `fixture/before.module.less` preserve the base revision
for the before screenshot; `proof.tsx` imports the fixed component directly.

## Reproduce the browser checks

1. Check out the PR code branch based on the commit above.
2. Copy this branch's `fixture` directory to `console/.slider-proof` in that checkout.
3. In `console`, run `npm ci`, then
   `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5278 --strictPort`.
4. With Node.js 22+ and a locally installed Chrome/Chromium, run
   `node /path/to/evidence/run-proof.cjs`. Set `CHROME_BIN` if Chrome is not at
   the Windows default path used by the runner. Port 5478 must be available.
5. The runner writes its screenshots and JSON report beside itself in
   `upstream-slider-proof/` and closes its isolated headless browser.
6. Remove the temporary `console/.slider-proof` fixture after checking.

The fixture also supports `?before=1`, `?dark=1`, and `?prefix=ant` for manual
inspection at `http://127.0.0.1:5278/.slider-proof/index.html`.
