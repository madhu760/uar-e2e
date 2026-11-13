import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { sessionStorageFilePath } from './utils/constants.js';

const packageDir = path.dirname(fileURLToPath(import.meta.url));

// Load .env from this package so APP_URL is set when the Playwright VS Code
// extension runs with cwd = repo root or ui-app (default dotenv only reads cwd).
config({ path: path.join(packageDir, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  // 1 minute 30 seconds timeout in milliseconds.
  timeout: 90 * 1000,
  outputDir: '.playwright/test-results',
  /* Run tests in files in parallel */
  fullyParallel: true,
  retries: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { outputFolder: '.playwright/report' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.APP_URL,

    /** @see https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',

    launchOptions: {
      slowMo: parseInt(process.env.PLAYWRIGHT_SLOW_MO || '0'),
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'global_setup',
      testMatch: /auth.setup\.ts/,
      teardown: 'global_teardown',
    },
    {
      name: 'global_teardown',
      testMatch: /logout.teardown\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: sessionStorageFilePath,
      },
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: sessionStorageFilePath,
      },
      dependencies: ['global_setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: sessionStorageFilePath,
      },
      dependencies: ['global_setup'],
    },
  ],
});
