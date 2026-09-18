import { chromium } from '@playwright/test';

export const profiles = {
    none: { label: 'Unthrottled', latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
    broadband: { label: '20 Mbps down / 5 Mbps up / 20 ms latency', latency: 20, downloadThroughput: 20e6 / 8, uploadThroughput: 5e6 / 8 },
    mobile: { label: '4 Mbps down / 1 Mbps up / 80 ms latency', latency: 80, downloadThroughput: 4e6 / 8, uploadThroughput: 1e6 / 8 },
};

export async function runBenchmarks({ baseURL, runs, profile, emit, signal }) {
    const channel = process.env.BENCHMARK_BROWSER || 'msedge';
    const browser = await chromium.launch({ channel, headless: true });
    if (signal.aborted) { await browser.close(); return; }
    const abort = () => { void browser.close(); };
    signal.addEventListener('abort', abort, { once: true });
    try {
        emit({ type: 'meta', browser: `${channel} ${browser.version()}`, profile, network: profiles[profile], runs, metric: 'navigation-to-first-gpu-completed-frame', compression: 'gzip', measuredAt: new Date().toISOString() });
        const engines = ['bare', 'pixi', 'phaser'];
        for (let round = 0; round < runs; round++) {
            for (let offset = 0; offset < engines.length; offset++) {
                const engine = engines[(round + offset) % engines.length];
                if (signal.aborted) return;
                // A fresh context and cleared cache isolate every cold sample.
                const context = await browser.newContext({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
                try {
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
                } finally { await context.close().catch(() => {}); }
            }
        }
        emit({ type: 'done' });
    } finally {
        signal.removeEventListener('abort', abort);
        await browser.close();
    }
}
