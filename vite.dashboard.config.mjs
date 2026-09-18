import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
const version = (name) => JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8')).version;
export default defineConfig({
  base: './',
  publicDir: false,
  define: { __VERSIONS__: JSON.stringify({ bare: version('bare-engine'), pixi: version('pixi.js'), phaser: version('phaser') }) },
  build: { target: 'es2020', rollupOptions: { input: ['index.html', 'startup/pixi/index.html', 'startup/phaser/index.html'] } },
});
