import { defineConfig } from '@playwright/test';

// Set SAHA_DEPLOYMENT_URL to exercise these exact tests on a real deployment.
const remote = process.env.SAHA_DEPLOYMENT_URL;
if (remote && !/^https?:\/\/[^/]+\/?$/.test(remote)) throw new Error('SAHA_DEPLOYMENT_URL must be an origin, without a path');
export default defineConfig({
  testDir:'./tests/browser',
  testMatch:['phase1.spec.js','deployment.spec.js'],
  timeout:30000,
  workers:1,
  use:{baseURL:remote || 'http://localhost:5174',channel:process.env.SAHA_BROWSER_CHANNEL || 'chrome',viewport:{width:390,height:844},hasTouch:true,isMobile:true,trace:'retain-on-failure'},
  outputDir:'test-results/deployment',
  ...(remote ? {} : {webServer:{command:'npm run preview',url:'http://localhost:5174',reuseExistingServer:false}})
});
