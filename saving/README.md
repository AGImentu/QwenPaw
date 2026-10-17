# Slow-save reasoning control proof

This fixture imports the actual official `SessionThinking`, rather than mocking
its React save/preview logic. HTTP preference writes are answered by the Electron
runner with a deliberate 650 ms delay. No real backend, account, user data, or
model inference is used.

The runner exercises real mouse clicks and a held drag while earlier saves
finish. It checks the visible label, thumb/track value, rail color, panel and
header geometry, disabled state, and whole-panel dimming at 16 ms intervals.
The latest choice stays visible while the server writes remain sequential.
It also opens advanced options and confirms that the existing decision-setting
switch still saves independently, retaining the thinking preference.

The test passed on Electron 22.3.27 / Chromium 108.0.5359.215. `result.json`
records the measurements' assertions, request order, and final state. The one
React development-mode forwardRef warning is recorded separately in
`developmentDiagnostics`; no runtime errors or unhandled rejections occurred.

## Reproduce

1. Check out the complete PR code branch and run `npm ci` in `console`.
2. Copy `saving/fixture` from this evidence branch to
   `console/.thinking-save-proof` in that checkout.
3. In `console`, run:
   `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5279 --strictPort`.
4. From the checkout root, use a local Electron 22 installation to run
   `/path/to/evidence/saving/run-proof.cjs`. If the current directory is not
   the checkout root, set `QWENPAW_REPO` to the root first. The runner uses an
   isolated browser profile and closes its test window when finished.
5. Read `thinking-complete-stability-result.json` beside the runner and the
   captured `thinking-complete-stable.png`.
6. Remove the temporary `console/.thinking-save-proof` fixture when done.

Example with the project's existing developer-side Electron installation:
`path/to/node_modules/.bin/electron /path/to/evidence/saving/run-proof.cjs`.
Electron is only used for this review evidence; this PR adds no runtime or
application dependencies.
