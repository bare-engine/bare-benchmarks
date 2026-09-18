# Engine benchmarks

Production startup benchmarks for Bare, PixiJS 8.21.0 and Phaser 4.2.1. Bare remains the existing Git dependency; package-lock.json records its revision.

Run `npm install`, then `npm start` and open http://127.0.0.1:4173. Requires installed Microsoft Edge. Set BENCHMARK_BROWSER=chrome to use installed Chrome instead. Select a sample count and network profile, then click Run benchmarks. Tests run in a separate local headless browser; your dashboard browser is only the controller. The results use horizontal bars for quick comparison while retaining exact median and min–max values.

- `npm run build`: all production pages into dist/.
- `npm run preview`: serve existing production builds and the controlled runner.
- `npm run dev`: build and serve; rebuild after source changes.
- `npm run dev:bare`: original Bare development server.
- `npm run typecheck`: check application TypeScript.
- `npm test`: browser tests including cold-cache misses, network profile, frame reporting, bars and cancellation.

## First rendered frame

All three engines load the same gear atlas, draw a centered 122 × 122 sprite on a 640 × 360 WebGL canvas at resolution 1 with antialiasing, and rotate it at 60 degrees/second. Bare retains its standard production bootstrap and parallel initial-asset loading; peers use native atlas loaders.

All report from their normal render loops after drawing the image. A shared microtask waits until the full render stack has returned (including Bare's flush), then calls WebGL finish() once to wait for GPU completion. The primary metric is navigation to the first GPU-completed frame, including that synchronization overhead. Exported samples also contain submittedMs, measured before finish(). Neither timestamp indicates physical monitor presentation. These numbers are not directly comparable to the previous submission-only benchmark.

## Cold cache

Every sample uses a fresh browser context. HTTP cache is explicitly cleared and service workers are blocked before the measured navigation, so code, images and other resources must load on every run. Each context is disposed after its sample. Engine order rotates each round.

Cold means empty HTTP cache, not a new browser process, OS, DNS cache or GPU driver. Browser/JIT/driver reuse can still affect measurements. Context isolation prevents another engine's shared assets from warming a sample.

## Network profiles

- Unthrottled: no artificial latency or bandwidth limit.
- Broadband: 20 Mbps download, 5 Mbps upload, 20 ms request latency.
- Mobile: 4 Mbps download, 1 Mbps upload, 80 ms request latency.

Profiles use Chromium DevTools network emulation, not simulated UI delays. No CPU throttling. The server gzips HTML, JS, CSS and JSON. These profiles are explicit laboratory settings, not claims about every real broadband/mobile connection.

The local Node server is required: ordinary static webpages cannot clear browser HTTP cache or apply network throttling. It listens on loopback and permits only same-origin run requests with fixed settings and local benchmark destinations. Cancel closes the controlled browser and preserves partial results. Missing browsers and engine failures are shown as errors, not zero scores.

## Files

- index.html and src/dashboard.*: runner UI and cold-cache results.
- src/game.ts and src/benchmarks/: engine scenes and shared first-frame reporting.
- scripts/build.mjs: production builds and shared atlas copies.
- scripts/serve.mjs: local static server and streaming run API.
- scripts/runner.mjs: browser isolation, cache control and throttling.
- tests/startup.spec.mjs: end-to-end verification; writes screenshots and JSON under test-results/.

Render time and bundle size remain future benchmarks. skipLibCheck avoids upstream engine declaration conflicts while application TypeScript remains checked.

References: [DevTools Network protocol](https://chromedevtools.github.io/devtools-protocol/tot/Network/), [Playwright CDP sessions](https://playwright.dev/docs/api/class-cdpsession).
