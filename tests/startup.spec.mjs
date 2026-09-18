import { test, expect } from '@playwright/test';
test('production engines render the gear and dashboard collects startup samples', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const engine of ['bare', 'pixi', 'phaser']) {
        await page.goto(`http://127.0.0.1:4173/startup/${engine}/index.html`);
        await page.waitForFunction(() => window.__benchmarkResult?.ms > 0);
        const result = await page.evaluate(() => ({ ...window.__benchmarkResult, width: document.querySelector('canvas').width, height: document.querySelector('canvas').height }));
        expect(result.engine).toBe(engine);
        expect(result.width).toBe(640);
        expect(result.height).toBe(360);
        await page.screenshot({ path: `test-results/${engine}.png` });
    }
    await page.goto('http://127.0.0.1:4173');
    await expect(page.locator('#status')).toContainText('Complete', { timeout: 90000 });
    await expect(page.locator('#results tr')).toHaveCount(3);
    for (const row of await page.locator('#results tr').all()) {
        await expect(row.locator('td').nth(3)).toHaveText('10');
        await expect(row.locator('.time')).toContainText('ms');
    }
    await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true });
    console.log(await page.locator('#results').innerText());
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#download').click();
    await (await downloadEvent).saveAs('test-results/startup-results.json');
    expect(errors).toEqual([]);
});
