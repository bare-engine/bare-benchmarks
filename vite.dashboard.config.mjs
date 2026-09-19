import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
const version = (name) => JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8')).version;
export default defineConfig({
  base: './',
  publicDir: false,
  define: { __VERSIONS__: JSON.stringify({ bare: version('bare-engine'), pixi: version('pixi.js'), phaser: version('phaser'), melon: version('melonjs'), excalibur: version('excalibur'), kaplay: version('kaplay'), littlejs: version('littlejsengine') }) },
  build: { target: 'es2022', rollupOptions: { input: ['index.html', 'benchmarks/startup/index.html', 'benchmarks/startup/pixi/index.html', 'benchmarks/startup/phaser/index.html', 'benchmarks/startup/melon/index.html', 'benchmarks/startup/excalibur/index.html', 'benchmarks/startup/kaplay/index.html', 'benchmarks/startup/littlejs/index.html'] } },
});
