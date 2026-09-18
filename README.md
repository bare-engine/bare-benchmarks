# Engine benchmarks

Production startup benchmarks for Bare, PixiJS 8.21.0 and Phaser 4.2.1 (npm latest installed September 18, 2026). Bare remains the existing Git dependency; package-lock.json records its revision.

Run `npm start`, then open the printed localhost URL. The index automatically measures 10 samples per engine and shows median, min–max and sample counts. Select 3, 10 or 30 samples to rerun. Download results exports the raw samples as JSON.

- `npm run build`: build all production pages into dist/.
- `npm run preview`: serve existing production builds.
- `npm run dev`: build and serve production benchmarks; rebuild after changes.
- `npm run dev:bare`: original Bare development server.
- `npm run typecheck`: check application TypeScript.
- `npm test`: browser verification using installed Microsoft Edge; build first.

Use an HTTP server, not file://.

## Measurement

Each engine loads the same one-image gear atlas, draws a centered 122 × 122 sprite on a 640 × 360 WebGL canvas at resolution 1, and rotates it at 60 degrees/second. Antialiasing is enabled. Bare keeps its engine-provided production pipeline, bootstrap and initial-asset preloads. PixiJS and Phaser use their native atlas loaders. The task is equivalent; engine boot paths remain different.

Each sample navigates a fresh iframe. Only one engine runs at a time, and order rotates each round. performance.now() measures from the child navigation time origin to the first render submission, including HTML/script loading, evaluation, initialization and image loading. A microtask after the render callback includes the complete render stack, including Bare's final flush. This does not measure GPU completion or physical display presentation.

Browser caching stays enabled: first visits may be cold; subsequent samples are warm. The iframe query changes, but asset URLs remain stable. This is not a controlled cold-cache test. Keep the tab visible; hiding it aborts the run. Failed engines time out after 30 seconds without inventing results.

Render time and bundle size are reserved for later benchmarks.

## Files

- index.html and src/dashboard.*: runner and results UI.
- src/game.ts: original Bare scene with first-frame reporting.
- src/benchmarks/: PixiJS, Phaser and shared reporting.
- scripts/build.mjs: builds dashboard and peers, builds Bare separately, copies the same atlas to peers.
- dist/startup/{bare,pixi,phaser}/index.html: standalone production scenes.
- tests/startup.spec.mjs: verifies engine reporting, canvas sizes, aggregation and export; writes screenshots and raw JSON to test-results/.

skipLibCheck avoids conflicting engine shader declarations and upstream Phaser declaration errors; application TypeScript remains checked.

API references: [PixiJS Application](https://pixijs.com/8.x/guides/components/application), [Phaser loader](https://docs.phaser.io/phaser/concepts/loader).
