import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', testIgnore: 'deployment.spec.js', timeout: 30000, workers: 1,
  use: { baseURL: 'http://localhost:5173', channel: process.env.SAHA_BROWSER_CHANNEL || 'chrome', viewport: {width:390,height:844}, hasTouch:true, isMobile:true, trace:'retain-on-failure' },
  webServer: { command: 'node server.mjs', url: 'http://localhost:5173', reuseExistingServer: true }
});
