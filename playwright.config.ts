import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 1 : 4,
    timeout: 45000,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    webServer: {
        command: isCI ? 'pnpm start' : 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !isCI,
        timeout: 120 * 1000,
    },
    projects: isCI
        ? [
              {
                  name: 'chromium',
                  use: { ...devices['Desktop Chrome'] },
              },
          ]
        : [
              {
                  name: 'chromium',
                  use: { ...devices['Desktop Chrome'] },
              },
              {
                  name: 'Mobile Chrome',
                  use: { ...devices['Pixel 5'] },
              },
              {
                  name: 'Mobile Safari',
                  use: { ...devices['iPhone 12'] },
              },
          ],
});
