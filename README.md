# Engine benchmarks

Production startup benchmarks for Bare, PixiJS 8.21.0, Phaser 4.2.1, MelonJS 20.6.0, Excalibur 0.32.0, KAPLAY 3001.0.19 and LittleJS 1.18.29. Bare remains the existing Git dependency; package-lock.json records its revision.

Run `npm install`, then `npm start` and open http://127.0.0.1:4173. Requires installed Microsoft Edge. Set BENCHMARK_BROWSER=chrome to use installed Chrome instead. Select a sample count and network profile, then click Run benchmarks. Tests run in a separate local headless browser; your dashboard browser is only the controller. The results use horizontal bars for quick comparison while retaining exact median and min–max values.

- `npm run build`: all production pages into dist/.
- `npm run preview`: serve existing production builds and the controlled runner.
- `npm run dev`: build and serve; rebuild after source changes.
- `npm run dev:bare`: Bare development server for the startup scene (`npm run dev:bare:render` for the bunnymark).
- `npm run typecheck`: check application TypeScript.

## First rendered frame

Every engine draws the same centered 122 × 122 gear on a 640 × 360 WebGL canvas at resolution 1 with antialiasing. The gear is one webp embedded in each bundle as a data URL (benchmarks/shared/gear.webp via Vite `?inline`), so no page makes an asset request: the metric is engine boot to first rendered frame, with the identical decode and texture upload in every engine. Each engine loads the data URL through its own native image loader; Bare's project has no packed atlas, so its bootstrap preloads nothing.

All report from their normal render loops after drawing the image. A shared microtask waits until the full render stack has returned (including Bare's flush), then calls WebGL finish() once to wait for GPU completion. The primary metric is navigation to the first GPU-completed frame, including that synchronization overhead. Exported samples also contain submittedMs, measured before finish(). Neither timestamp indicates physical monitor presentation.

## Sprites at full frame rate

A bunnymark (benchmarks/render/, simulation and ramp in benchmarks/shared/bunnies.ts), after the Rapid.js benchmark. 32 px gears with random velocity and spin bounce off the edges of a 640 × 360 WebGL canvas. The simulation is shared typed-array code; each engine creates its ordinary sprite objects (PixiJS Sprite, Phaser Image, melonJS Sprite, Excalibur Actor with collision disabled, KAPLAY sprite object, LittleJS EngineObject, Bare GameObject) and copies x, y and rotation into them once per frame. Special batching objects such as PixiJS ParticleContainer or Phaser SpriteGPULayer are deliberately not used.

Headless Chromium caps requestAnimationFrame at the display rate, so ms per frame would saturate at one vsync. The page measures the empty-scene frame rate, then holds 1,000, 2,000, 4,000 … sprites for a 0.5 s warm-up plus a 1 s sample each until the rate falls under 90 % of the empty-scene rate, and bisects three times. The value is the largest passing count; each sample also records the frame rate at that count and the ramp steps. Each engine still gets a fresh browser per sample; the network profile only affects page load.

## Cold cache

Every sample uses a fresh browser context. HTTP cache is explicitly cleared and service workers are blocked before the measured navigation, so the HTML and code must load on every run. Each context is disposed after its sample. Engine order rotates each round.

Cold means empty HTTP cache, not a new browser process, OS, DNS cache or GPU driver. Browser/JIT/driver reuse can still affect measurements. Context isolation prevents another engine's shared assets from warming a sample.

## Network profiles

- Unthrottled: no artificial latency or bandwidth limit.
- Fast 4G: 8.1 Mbit/s download, 1.4 Mbit/s upload, 165 ms request latency.
- Slow 4G: 1.4 Mbit/s download, 675 kbit/s upload, 562.5 ms request latency.
- 3G: 400 kbit/s download, 400 kbit/s upload, 2000 ms request latency.

Profiles use Chromium DevTools network emulation, not simulated UI delays. No CPU throttling. The server gzips HTML, JS, CSS and JSON. With no asset requests, throttled profiles mostly measure bundle download size. These profiles are explicit laboratory settings, matching Chrome DevTools' built-in presets, not claims about every real connection.

The local Node server is required: ordinary static webpages cannot clear browser HTTP cache or apply network throttling. It listens on loopback and permits only same-origin run requests with fixed settings and local benchmark destinations. Cancel closes the controlled browser and preserves partial results. Missing browsers and engine failures are shown as errors, not zero scores.

## Files

- index.html and src/dashboard.*: runner UI and cold-cache results.
- benchmarks/startup/<engine>/ and benchmarks/render/<engine>/: each engine's page and scene per benchmark. benchmarks/shared/ holds first-frame reporting, the inlined gear image and the bunnymark simulation + ramp.
- benchmarks/<bench>/bare/: Bare is a self-contained Bare project (own package.json, Vite config and src/game.ts), since its build is driven by the engine's Vite plugins. Neither has texturePackImages, so nothing is packed or preloaded.
- scripts/build.mjs: production builds and bundle-size measurement (measured on the startup pages).
- scripts/serve.mjs: local static server and streaming run API.
- scripts/runner.mjs: browser isolation, cache control and throttling.

Render time and bundle size remain future benchmarks. skipLibCheck avoids upstream engine declaration conflicts while application TypeScript remains checked.

References: [DevTools Network protocol](https://chromedevtools.github.io/devtools-protocol/tot/Network/), [Playwright CDP sessions](https://playwright.dev/docs/api/class-cdpsession).
