import { test, expect } from '@playwright/test';
const baseURL = 'http://127.0.0.1:4287';
test('first rendered frame, cold cache and throttled profile', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const engine of ['bare', 'pixi', 'phaser', 'melon', 'excalibur', 'kaplay', 'littlejs']) {
        await page.goto(`${baseURL}/startup/${engine}/index.html`);
        await page.waitForFunction(() => window.__benchmarkResult?.ms > 0);
        const result = await page.evaluate(() => ({ ...window.__benchmarkResult, width: document.querySelector('canvas').width, height: document.querySelector('canvas').height }));
        expect(result.engine).toBe(engine);
        expect(result.width).toBe(640);
        expect(result.height).toBe(360);
        expect(result.ms).toBeGreaterThanOrEqual(result.submittedMs);
        expect(result.metric).toBe('navigation-to-first-gpu-completed-frame');
        await page.screenshot({ path: `test-results/${engine}.png` });
    }
    await page.goto(baseURL);
    await page.locator('#runs').selectOption('3');
    await page.locator('#run').click();
    await expect(page.locator('#status')).toContainText('Complete', { timeout: 90000 });
    for (const row of await page.locator('#results tr').all()) {
        await expect(row.locator('.range')).toContainText('3 samples');
        const width = await row.locator('.bar').evaluate(element => parseFloat(element.style.width));
        expect(width).toBeGreaterThan(0);
        expect(width).toBeLessThanOrEqual(100);
    }
    const raw = await page.evaluate(async () => (await fetch('/api/run?runs=3&profile=none', { method: 'POST' })).text());
    const events = raw.trim().split('\n').map(line => JSON.parse(line));
    const samples = events.filter(event => event.type === 'sample');
    expect(samples).toHaveLength(21);
    for (const sample of samples) {
        const assets = sample.requests.filter(r => !r.url.includes('index.html'));
        expect(assets.length).toBeGreaterThan(0);
        expect(assets.every(r => !r.cached)).toBe(true);
    }
    await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true });
    await page.locator('#profile').selectOption('mobile');
    await page.locator('#run').click();
    await expect(page.locator('#status')).toContainText('Complete', { timeout: 120000 });
    await expect(page.locator('#environment')).toContainText('4 Mbps');
    console.log(await page.locator('#results').innerText());
    expect(errors).toEqual([]);
});
test('invalid configurations are rejected and cancellation releases runner', async ({ page }) => {
    await page.goto(baseURL);
    const status = await page.evaluate(async () => (await fetch('/api/run?runs=-1&profile=none', { method: 'POST' })).status);
    expect(status).toBe(400);
    await page.locator('#run').click();
    await expect(page.locator('#cancel')).toBeEnabled();
    await page.locator('#cancel').click();
    await expect(page.locator('#status')).toContainText('Cancelled');
    await expect(page.locator('#run')).toBeEnabled();
    await expect.poll(async () => page.evaluate(async () => {
        const response = await fetch('/api/run?runs=1&profile=none', { method: 'POST' });
        if (response.status === 409) return false;
        const events = (await response.text()).trim().split('\n').map(line => JSON.parse(line));
        return events.some(event => event.type === 'done') && events.filter(event => event.type === 'sample').length === 7;
    }), { timeout: 30000 }).toBe(true);
});

