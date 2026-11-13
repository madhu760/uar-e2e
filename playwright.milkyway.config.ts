import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { milkywaySessionStorageFilePath } from './scripts/milkyway-auth/constants.mjs';

const packageDir = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.join(packageDir, '.env') });

/**
 * Separate config for the milkyway tenant: its login is email + one-time code,
 * not the Okta email/password flow playwright.config.ts's auth.setup assumes,
 * so it can't run unattended. Session comes from the manual relay in
 * scripts/milkyway-auth/ (see README) instead of a global_setup project.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /uar\/.*\.spec\.ts/,
  timeout: 90 * 1000,
  outputDir: '.playwright/test-results-milkyway',
  // All tests share one real staging session (single manually-OTP'd login) —
  // concurrent tests fighting over the same account/session caused spurious
  // failures (dialogs not opening in time, etc.), so run serially.
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.MILKYWAY_APP_URL,
    trace: 'retain-on-failure',
    // Video is off by default (adds overhead/disk use on every run) — turn it
    // on for a specific run with PW_VIDEO=on, e.g. when recording a demo.
    video: process.env.PW_VIDEO === 'on' ? 'on' : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: milkywaySessionStorageFilePath,
        headless: process.env.PW_VIDEO !== 'on',
      },
    },
  ],
});
