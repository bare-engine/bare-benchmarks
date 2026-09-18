import { build } from 'vite';
import { createRequire } from 'node:module';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
const require = createRequire(import.meta.url);
await build({ configFile: 'vite.dashboard.config.mjs' });
const bare = require('bare-engine/config/vite.config.cjs')({ mode: 'production' });
await build({ ...bare, configFile: false, mode: 'production', build: { ...bare.build, outDir: 'dist/startup/bare' } });
for (const engine of ['pixi', 'phaser', 'melon', 'excalibur', 'kaplay', 'littlejs']) {
  await mkdir(`dist/startup/${engine}/initial/generated`, { recursive: true });
  for (const file of ['texturePackImages.json', 'texturePackImages.webp']) {
    await copyFile(`public/initial/generated/${file}`, `dist/startup/${engine}/initial/generated/${file}`);
  }
}

// Bundle sizes are a property of the build, so measure them once here: load each page in a headless
// browser and sum the compressed bytes of every script it actually fetches before the first frame.
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
    await page.goto(`http://127.0.0.1:${port}/startup/${engine}/index.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__benchmarkResult, {}, { timeout: 60000 });
    sizes[engine] = bytes;
    await context.close();
  }
} finally { await browser.close(); server.kill(); }
await writeFile('dist/sizes.json', JSON.stringify(sizes));
console.log('JS gzipped:', Object.entries(sizes).map(([engine, bytes]) => `${engine} ${(bytes / 1024).toFixed(1)} KB`).join(' · '));
