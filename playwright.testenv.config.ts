import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { testenvSessionStorageFilePath } from './scripts/testenv-auth/constants.mjs';

const packageDir = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.join(packageDir, '.env') });

/**
 * Config for the "test" environment (same email + one-time-code login as
 * milkyway/staging — see playwright.milkyway.config.ts for why that can't run
 * unattended). Session comes from the manual relay in scripts/testenv-auth/.
 *
 * Runs headed with video recording on, for demo purposes — every run leaves a
 * .webm video per test in outputDir regardless of pass/fail, unlike the
 * retain-on-failure trace used elsewhere.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /uar\/.*\.spec\.ts/,
  timeout: 90 * 1000,
  outputDir: '.playwright/test-results-testenv',
  // Shares one real session (single manually-OTP'd login) — run serially.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.TESTENV_APP_URL,
    trace: 'retain-on-failure',
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 },
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        storageState: testenvSessionStorageFilePath,
      },
    },
  ],
});
