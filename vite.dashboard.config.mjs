import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
const version = (name) => JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8')).version;
export default defineConfig({
  base: './',
  publicDir: false,
  // npm run dev: live-reloading dashboard. Sizes and the runner come from `npm run preview` on 4173 when it is running.
  server: { proxy: { '/api': 'http://127.0.0.1:4173', '/sizes.json': 'http://127.0.0.1:4173' } },
  define: { __VERSIONS__: JSON.stringify({ bare: version('bare-engine'), pixi: version('pixi.js'), phaser: version('phaser'), melon: version('melonjs'), excalibur: version('excalibur'), kaplay: version('kaplay'), littlejs: version('littlejsengine') }) },
  build: { target: 'es2022', rollupOptions: { input: ['index.html', ...['startup', 'render'].flatMap(bench => ['', 'pixi/', 'phaser/', 'melon/', 'excalibur/', 'kaplay/', 'littlejs/'].map(page => `benchmarks/${bench}/${page}index.html`))] } },
});
