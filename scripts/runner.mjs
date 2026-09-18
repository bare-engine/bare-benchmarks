import { chromium } from '@playwright/test';

export const profiles = {
    none: { label: 'Unthrottled', latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
    broadband: { label: '20 Mbps down / 5 Mbps up / 20 ms latency', latency: 20, downloadThroughput: 20e6 / 8, uploadThroughput: 5e6 / 8 },
    mobile: { label: '4 Mbps down / 1 Mbps up / 80 ms latency', latency: 80, downloadThroughput: 4e6 / 8, uploadThroughput: 1e6 / 8 },
};

export async function runBenchmarks({ baseURL, runs, profile, emit, signal }) {
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
                if (round === 0 && offset === 0) emit({ type: 'meta', browser: `${channel} ${browser.version()}`, profile, network: profiles[profile], runs, metric: 'navigation-to-first-gpu-completed-frame', compression: 'gzip', measuredAt: new Date().toISOString() });
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
                        await page.goto(`${baseURL}/startup/${engine}/index.html`, { waitUntil: 'load', timeout: 60000 });
                        await page.waitForFunction(() => window.__benchmarkResult, { }, { timeout: 60000 });
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
