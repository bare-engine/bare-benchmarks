import { build } from 'vite';
import { createRequire } from 'node:module';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
const require = createRequire(import.meta.url);
const root = process.cwd();

await build({ configFile: 'vite.dashboard.config.mjs' }); // empties dist/, so it goes first

// Bare is a self-contained project in benchmarks/<bench>/bare and its Vite config keys off cwd, so build it from
// there. Its asset step (buildAssets.cjs) runs so src/generated/assets.ts exists; it needs texturePackImages/ to exist
// and clears public/initial/generated.
//  - startup: no texturePackImages, so nothing is packed and index.html gets no <link rel=preload>; the gear is inlined.
//  - startupAtlas: the pre-packed atlas in benchmarks/startupAtlas/atlas is copied in after the packer, so Bare
//    preloads it, and the same two files are copied to every other engine's page.
const engines = ['pixi', 'phaser', 'melon', 'excalibur', 'kaplay', 'littlejs'];
const atlasFiles = ['texturePackImages.json', 'texturePackImages.webp'];
for (const bench of ['startup', 'startupAtlas']) {
  process.chdir(`benchmarks/${bench}/bare`);
  await mkdir('texturePackImages', { recursive: true });
  const packed = spawnSync(process.execPath, [resolve(root, 'node_modules/bare-engine/scripts/buildAssets.cjs')], { stdio: 'inherit' });
  if (packed.status !== 0) process.exit(packed.status ?? 1);
  if (bench === 'startupAtlas') {
    await mkdir('public/initial/generated', { recursive: true });
    for (const file of atlasFiles) await copyFile(resolve(root, 'benchmarks/startupAtlas/atlas', file), `public/initial/generated/${file}`);
  }
  const bare = require('bare-engine/config/vite.config.cjs')({ mode: 'production' });
  await build({ ...bare, configFile: false, mode: 'production', build: { ...bare.build, outDir: resolve(root, `dist/benchmarks/${bench}/bare`) } });
  process.chdir(root);
}
for (const engine of engines) {
  await mkdir(`dist/benchmarks/startupAtlas/${engine}/initial/generated`, { recursive: true });
  for (const file of atlasFiles) await copyFile(`benchmarks/startupAtlas/atlas/${file}`, `dist/benchmarks/startupAtlas/${engine}/initial/generated/${file}`);
}

// Bundle sizes are a property of the build, so measure them once here (on the startup pages): load each page in a
// headless browser and sum the compressed bytes of every script it actually fetches before the first frame.
// A static import-graph walk would over-count engines that reference chunks they never load.
const port = 4180 + Math.floor(Math.random() * 100);
const server = spawn(process.execPath, ['scripts/serve.mjs', '--port', String(port)], { stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 1000));
const sizes = {};
const browser = await chromium.launch({ channel: process.env.BENCHMARK_BROWSER || 'msedge', headless: true });
try {
  for (const engine of ['bare', 'pixi', 'phaser', 'melon', 'excalibur', 'kaplay', 'littlejs']) {
    const context = await browser.newContext({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    const scripts = new Set();
    let bytes = 0;
    cdp.on('Network.responseReceived', ({ requestId, response }) => { if (/javascript/i.test(response.mimeType)) scripts.add(requestId); });
    cdp.on('Network.loadingFinished', ({ requestId, encodedDataLength }) => { if (scripts.has(requestId)) bytes += encodedDataLength; });
    page.on('pageerror', error => console.error(`${engine}: ${error.message}`));
    await page.goto(`http://127.0.0.1:${port}/benchmarks/startup/${engine}/index.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__benchmarkResult, {}, { timeout: 60000 });
    sizes[engine] = bytes;
    await context.close();
  }
} finally { await browser.close(); server.kill(); }
await writeFile('dist/sizes.json', JSON.stringify(sizes));
console.log('JS gzipped:', Object.entries(sizes).map(([engine, bytes]) => `${engine} ${(bytes / 1024).toFixed(1)} KB`).join(' · '));
