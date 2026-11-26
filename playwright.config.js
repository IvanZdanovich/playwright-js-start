// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const { getEnvironment } = require('./config/environments');
const { TIMEOUTS } = require('./playwright/constants/timeouts');

const environment = getEnvironment();
const browserProjects = {
  chromium: devices['Desktop Chrome'],
  chrome: { ...devices['Desktop Chrome'], channel: 'chrome' },
  edge: { ...devices['Desktop Edge'], channel: 'msedge' },
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
};
const browser = process.env.BROWSER || 'chromium';
if (!browserProjects[browser]) {
  throw new Error(`Invalid BROWSER "${browser}". Valid options: ${Object.keys(browserProjects).join(', ')}`);
}
const browserUse = { ...browserProjects[browser], viewport: { width: 1600, height: 1200 } };

module.exports = defineConfig({
  testDir: './playwright',
  // Files run in parallel across workers; tests inside one file run in order in one worker.
  // Every spec also declares `mode: 'serial'`, because contexts build on each other's state.
  fullyParallel: false,
  workers: process.env.PARALLEL_STREAMS ? Number(process.env.PARALLEL_STREAMS) : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: TIMEOUTS.uiAssertion },
  outputDir: 'test-results',
  reporter: [['list'], ['json', { outputFile: 'reports/results.json' }], ['html', { outputFolder: 'reports/html', open: 'never' }]],
  use: {
    baseURL: environment.baseUrl,
    testIdAttribute: 'data-test',
    actionTimeout: TIMEOUTS.uiCommand,
    navigationTimeout: TIMEOUTS.pageLoad,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /support\/auth\.setup\.js$/, use: browserUse },
    { name: 'integration-api', testMatch: /integration\/api\/.*\.api\.spec\.js$/ },
    { name: 'integration-ui', testMatch: /integration\/ui\/.*\.ui\.spec\.js$/, dependencies: ['setup'], use: browserUse },
    { name: 'e2e-ui', testMatch: /e2e\/ui\/.*\.ui\.spec\.js$/, dependencies: ['setup'], use: browserUse },
  ],
});
