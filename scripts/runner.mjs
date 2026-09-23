import { chromium } from '@playwright/test';

export const profiles = {
    none: { label: 'Unthrottled', latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
    fast4g: { label: 'Fast 4G', latency: 165, downloadThroughput: 8.1e6 / 8, uploadThroughput: 1.4e6 / 8 },
    slow4g: { label: 'Slow 4G', latency: 562.5, downloadThroughput: 1.4e6 / 8, uploadThroughput: 675e3 / 8 },
    '3g': { label: '3G', latency: 2000, downloadThroughput: 400e3 / 8, uploadThroughput: 400e3 / 8 },
};

// Per benchmark: what the page reports and how long a sample may take. The render page ramps its sprite
// count over many one-second windows, so it needs far longer than a startup page.
export const benches = {
    startup: { metric: 'navigation-to-first-gpu-completed-frame', timeout: 60000 },
    render: { metric: 'sprites-at-full-frame-rate', timeout: 600000 },
};

export async function runBenchmarks({ baseURL, bench, runs, profile, emit, signal }) {
    const channel = process.env.BENCHMARK_BROWSER || 'msedge';
    let browser;
    const abort = () => { void browser?.close(); };
    signal.addEventListener('abort', abort, { once: true });
    try {
        const engines = ['bare', 'pixi', 'phaser', 'melon', 'excalibur', 'kaplay', 'littlejs'];
        for (let round = 0; round < runs; round++) {
            for (let offset = 0; offset < engines.length; offset++) {
                const engine = engines[(round + offset) % engines.length];
                if (signal.aborted) return;
                // The GPU process (and ANGLE's compiled-shader cache inside it) outlives browser contexts,
                // so a warm sample would skip shader compilation. A fresh browser per sample keeps every
                // sample cold; the warm-up below only spins up the GPU process itself, which a real visitor's
                // already-running browser would have done long before navigating.
                browser = await chromium.launch({ channel, headless: true });
                if (signal.aborted) return;
                if (round === 0 && offset === 0) emit({ type: 'meta', bench, browser: `${channel} ${browser.version()}`, profile, network: profiles[profile], runs, metric: benches[bench].metric, compression: 'gzip', measuredAt: new Date().toISOString() });
                const context = await browser.newContext({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
                try {
                    const warmup = await context.newPage();
                    await warmup.goto('about:blank');
                    await warmup.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); gl?.clear(gl.COLOR_BUFFER_BIT); gl?.finish(); });
                    await warmup.close();
                    const page = await context.newPage();
                    const cdp = await context.newCDPSession(page);
                    await cdp.send('Network.enable');
                    await cdp.send('Network.clearBrowserCache');
                    await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
                    const { label, ...network } = profiles[profile];
                    await cdp.send('Network.emulateNetworkConditions', { offline: false, ...network });
                    let requests = [];
                    cdp.on('Network.responseReceived', ({ response }) => requests.push({ url: response.url, cached: !!(response.fromDiskCache || response.fromPrefetchCache) }));
                    let pageError;
                    page.on('pageerror', error => { pageError = error.message; });
                    const navigate = async () => {
                        requests = []; pageError = undefined;
                        await page.goto(`${baseURL}/benchmarks/${bench}/${engine}/index.html`, { waitUntil: 'load', timeout: 60000 });
                        await page.waitForFunction(() => window.__benchmarkResult, { }, { timeout: benches[bench].timeout });
                        if (pageError) throw new Error(pageError);
                        return { ...await page.evaluate(() => window.__benchmarkResult), requests };
                    };
                    emit({ type: 'progress', engine, round: round + 1 });
                    const sample = await navigate();
                    emit({ ...sample, type: 'sample', engine, round: round + 1 });
                } catch (error) {
                    if (signal.aborted) return;
                    emit({ type: 'failure', engine, round: round + 1, error: String(error) });
                } finally { await browser.close().catch(() => {}); }
            }
        }
        emit({ type: 'done' });
    } finally {
        signal.removeEventListener('abort', abort);
        await browser?.close().catch(() => {});
    }
}
