import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './tests', timeout: 120000, workers: 1,
    use: { channel: 'msedge', headless: true, viewport: { width: 1200, height: 1000 } },
    webServer: { command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
});
