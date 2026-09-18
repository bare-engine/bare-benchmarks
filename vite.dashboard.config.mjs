import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
const version = (name) => JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8')).version;
export default defineConfig({
  base: './',
  publicDir: false,
  define: { __VERSIONS__: JSON.stringify({ bare: version('bare-engine'), pixi: version('pixi.js'), phaser: version('phaser'), melon: version('melonjs'), excalibur: version('excalibur'), kaplay: version('kaplay'), littlejs: version('littlejsengine') }) },
  build: { target: 'es2022', rollupOptions: { input: ['index.html', 'startup/pixi/index.html', 'startup/phaser/index.html', 'startup/melon/index.html', 'startup/excalibur/index.html', 'startup/kaplay/index.html', 'startup/littlejs/index.html'] } },
});
