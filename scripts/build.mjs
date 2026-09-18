import { build } from 'vite';
import { createRequire } from 'node:module';
import { mkdir, copyFile } from 'node:fs/promises';
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
