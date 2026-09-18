import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './tests', timeout: 180000, workers: 1,
    use: { channel: process.env.BENCHMARK_BROWSER || 'msedge', headless: true, viewport: { width: 1200, height: 1000 } },
    webServer: { command: 'npm run preview -- --port 4287', url: 'http://127.0.0.1:4287', reuseExistingServer: false },
});

