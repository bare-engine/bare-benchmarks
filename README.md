# Web game engine benchmarks

Production startup benchmarks for Bare, PixiJS 8.21.0, Phaser 4.2.1, MelonJS 20.6.0, Excalibur 0.32.0, KAPLAY 3001.0.19 and LittleJS 1.18.29. Bare remains the existing Git dependency; package-lock.json records its revision.

Run `npm install`, then `npm start` and open http://127.0.0.1:4173. Requires installed Microsoft Edge. Set BENCHMARK_BROWSER=chrome to use installed Chrome instead. Select a sample count and network profile, then click Run benchmarks. Tests run in a separate local headless browser; your dashboard browser is only the controller. The results use horizontal bars for quick comparison while retaining exact median and min–max values.

- `npm run build`: all production pages into dist/.
- `npm run preview`: serve existing production builds and the controlled runner.
- `npm run dev`: build and serve; rebuild after source changes.
- `npm run dev:bare`: Bare development server for the startup scene (`npm run dev:bare:render` for the bunnymark).
- `npm run typecheck`: check application TypeScript.

## First rendered frame

Every engine draws the same gear, inlined into its JavaScript bundle as a data URL (benchmarks/shared/gear.webp via Vite `?inline`). Each engine passes that data URL to its own image loader, so every page decodes and uploads the identical image, and the only requests are the HTML and the bundle. Bare's project has no packed atlas, so its bootstrap preloads nothing.

The clock starts at navigation and stops once the first frame showing the gear has finished on the GPU. Each engine reports from its normal render loop after drawing that frame; a shared microtask waits for the full render stack to return (including Bare's flush), then calls WebGL finish() once. The time therefore covers HTML and script download and parse, engine boot, image decode and texture upload, shader compilation, drawing, and GPU completion, including that synchronization overhead. Exported samples also contain submittedMs, measured before finish().

## Sprites at full frame rate

A bunnymark (benchmarks/render/, simulation and ramp in benchmarks/shared/bunnies.ts), after the Rapid.js benchmark. 32 px gears with random velocity and spin bounce off the edges of a 640 × 360 WebGL canvas. The simulation is shared typed-array code; each engine creates its ordinary sprite objects and copies x, y and rotation into them once per frame. Special batching objects such as PixiJS ParticleContainer or Phaser SpriteGPULayer are deliberately not used.

Headless Chromium caps requestAnimationFrame at the display rate, so ms per frame would saturate at one vsync. The page measures the empty-scene frame rate, then holds 1,000, 2,000, 4,000 … sprites for a 0.5 s warm-up plus a 1 s sample each until the rate falls under 90 % of the empty-scene rate, and bisects three times. The value is the largest passing count; each sample also records the frame rate at that count and the ramp steps. Each engine still gets a fresh browser per sample; the network profile only affects page load.

## Cold cache

Every sample launches a fresh browser. The GPU process, and the compiled-shader cache inside it, would otherwise outlive a browser context and let a later sample skip shader compilation. HTTP cache is explicitly cleared and service workers are blocked before the measured navigation, so the HTML, code and shaders load cold on every run. A blank WebGL page runs first so GPU process start-up is excluded, as in an already-open browser. The browser is closed after its sample. Engine order rotates each round.

Cold means a new browser with an empty HTTP cache, not a reset OS, DNS cache or GPU driver. OS and driver caches can still affect measurements.

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
