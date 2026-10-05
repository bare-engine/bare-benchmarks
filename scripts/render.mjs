// npm run render <startup|performance|bundle> [runs] [profile]
// Builds, runs the benchmark through the dashboard in a headless browser and saves just its title, description
// and results as docs/<type>-<date>.png, then points README.md's <!-- type --> … <!-- /type --> block at that image.
import { chromium } from '@playwright/test';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// runs: the choices in that benchmark's dashboard dropdown, first one the default.
const types = { startup: { bench: 'startup', runs: ['30', '3', '10'] }, performance: { bench: 'render', runs: ['3', '1', '10'] }, bundle: { results: 'sizes' } };
const [type, runs = types[type]?.runs?.[0], profile = 'none'] = process.argv.slice(2);
const usage = 'Usage: npm run render <startup|performance|bundle> [runs: startup 3|10|30 (30), performance 1|3|10 (3)] [profile: none|fast4g|slow4g|3g]';
if (!Object.hasOwn(types, type)) { console.error(usage); process.exit(1); }
if (types[type].bench && (!types[type].runs.includes(runs) || !['none', 'fast4g', 'slow4g', '3g'].includes(profile))) { console.error(usage); process.exit(1); }
const { bench } = types[type];
const results = types[type].results ?? `results-${bench}`;

const built = spawnSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' });
if (built.status !== 0) process.exit(built.status ?? 1);

const port = 4280 + Math.floor(Math.random() * 100);
const server = spawn(process.execPath, ['scripts/serve.mjs', '--port', String(port)], { stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 1000));
const browser = await chromium.launch({ channel: process.env.BENCHMARK_BROWSER || 'msedge', headless: true });
try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, locale: 'en-US' });
    await page.goto(`http://127.0.0.1:${port}/`);
    if (bench) {
        const controls = `.controls[data-bench="${bench}"]`;
        await page.selectOption(`${controls} .runs`, runs);
        await page.selectOption(`${controls} .profile`, profile);
        await page.click(`${controls} .run`);
        console.log(`Running ${type}: ${runs} run${runs === '1' ? '' : 's'} per engine, ${profile} network…`);
        await page.waitForFunction(selector => !document.querySelector(selector).disabled, `${controls} .run`, { timeout: 0, polling: 1000 });
        const status = await page.textContent(`${controls} + .statusline .status`);
        if (!status.startsWith('Complete')) throw new Error(status);
    } else await page.waitForFunction(() => document.querySelector('#sizes .bar[style*="width:"]:not([style*="width:0%"])'));

    // Title and per-engine values for the README alt text.
    const title = await page.evaluate(id => {
        let node = document.getElementById(id);
        while (!node.matches('.intro')) node = node.previousElementSibling;
        return node.querySelector('h2').textContent;
    }, results);
    const values = await page.$$eval(`#${results} .row`, rows => rows.map(row => `${row.querySelector('.name').textContent} ${row.querySelector('.time').textContent.trim()}`));

    // Keep only this benchmark's intro (without its link), sample count and results.
    await page.evaluate(id => {
        const results = document.getElementById(id);
        const keep = [results];
        let node = results.previousElementSibling;
        while (node && !node.matches('.intro')) {
            if (node.matches('.statusline')) { keep.push(node); node.querySelector('.status').textContent = node.textContent.replace(/^Complete · /, ''); }
            node = node.previousElementSibling;
        }
        keep.push(node);
        node.querySelector('a')?.remove();
        for (const child of document.querySelector('main').children) if (!keep.includes(child)) child.style.display = 'none';
        results.style.marginBottom = '0';
        node.style.marginTop = '0';
        node.querySelector('h2').style.marginTop = '0';
        document.querySelector('main').style.padding = '24px';
    }, results);
    await page.mouse.move(0, 0);
    await mkdir('docs', { recursive: true });
    const date = new Date().toLocaleDateString('sv'); // local YYYY-MM-DD
    const file = `docs/${type}-${date}.png`;
    await page.locator('main').screenshot({ path: file });
    console.log(`Saved ${file}`);

    const block = new RegExp(`(<!-- ${type} -->)[\\s\\S]*?(<!-- /${type} -->)`);
    const readme = await readFile('README.md', 'utf8');
    if (!block.test(readme)) console.warn(`README.md has no <!-- ${type} --> … <!-- /${type} --> block; not updated.`);
    else {
        // A single "Tested <date>:" line above the images holds the date of the latest run.
        const updated = readme.replace(block, (_, open, close) => `${open}\n![${title}: ${values.join(', ')}](${file})\n${close}`);
        await writeFile('README.md', updated.replace(/^Tested \d{4}-\d{2}-\d{2}:$/m, `Tested ${date}:`));
        console.log('Updated README.md');
    }
} finally {
    await browser.close();
    server.kill();
}
