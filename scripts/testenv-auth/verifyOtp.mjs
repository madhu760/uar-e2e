// Step 2 of the manual test-env login relay.
//
// Usage (from packages/uar-e2e), right after receiving the code from step 1
// (codes expire fast — run this immediately):
//   node scripts/testenv-auth/verifyOtp.mjs <6-digit-code>
//
// Resumes the browser profile requestOtp.mjs created, submits the code, and
// on success saves a Playwright storageState that playwright.testenv.config.ts
// consumes — so the actual test run (pnpm run e2e-test-testenv) skips login
// entirely and reuses this session.
import { chromium } from '@playwright/test';
import { config } from 'dotenv';
import {
  persistentProfileDir,
  testenvSessionStorageFilePath,
  getTestenvEnv,
} from './constants.mjs';

config();

const otp = process.argv[2];
if (!otp || !/^\d{6}$/.test(otp)) {
  throw new Error(
    'Usage: node scripts/testenv-auth/verifyOtp.mjs <6-digit-code>',
  );
}

const { appUrl, username } = getTestenvEnv();

const context = await chromium.launchPersistentContext(persistentProfileDir, {
  headless: true,
});
const page = context.pages()[0] ?? (await context.newPage());

await page.goto(
  `${appUrl}/#/verify-otp/${encodeURIComponent(username)}?redirectTo=%2Fmy%2Fwork`,
  { waitUntil: 'networkidle' },
);

await page.getByLabel('Enter verification code').fill(otp);

// Filling all 6 digits auto-submits; the Verify button click is a fallback for
// when it doesn't. Race the two outcomes instead of assuming either path.
const verifyBtn = page.getByRole('button', { name: 'Verify' });
await verifyBtn.click({ timeout: 5000 }).catch(() => {});

const navigatedAway = page.waitForURL((u) => !u.href.includes('verify-otp'), {
  timeout: 15000,
});
const authError = page.getByText('Authentication error').waitFor({ timeout: 15000 });

await Promise.race([
  navigatedAway,
  authError.then(() => {
    throw new Error('Authentication error: code invalid or expired.');
  }),
]);

await page.context().storageState({ path: testenvSessionStorageFilePath });

console.log(`Login succeeded. Session saved to ${testenvSessionStorageFilePath}.`);
console.log('Run: pnpm run e2e-test-testenv');

await context.close();
