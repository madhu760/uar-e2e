// Step 2 of the manual milkyway login relay.
//
// Usage (from packages/uar-e2e), right after receiving the code from step 1
// (codes expire fast — run this immediately):
//   node scripts/milkyway-auth/verifyOtp.mjs <6-digit-code>
//
// Resumes the browser profile requestOtp.mjs created, submits the code, and
// on success saves a Playwright storageState that playwright.milkyway.config.ts
// consumes — so the actual test run (pnpm run e2e-test-milkyway) skips login
// entirely and reuses this session.
import { chromium } from '@playwright/test';
import { config } from 'dotenv';
import {
  persistentProfileDir,
  milkywaySessionStorageFilePath,
  getMilkywayEnv,
} from './constants.mjs';

config();

const otp = process.argv[2];
if (!otp || !/^\d{6}$/.test(otp)) {
  throw new Error(
    'Usage: node scripts/milkyway-auth/verifyOtp.mjs <6-digit-code>',
  );
}

const { appUrl, username } = getMilkywayEnv();

const context = await chromium.launchPersistentContext(persistentProfileDir, {
  headless: true,
});
const page = context.pages()[0] ?? (await context.newPage());

await page.goto(
  `${appUrl}/#/verify-otp/${encodeURIComponent(username)}?redirectTo=%2Fmy%2Fwork`,
  { waitUntil: 'networkidle' },
);

await page.getByLabel('Enter verification code').fill(otp);

await page.waitForURL((u) => !u.href.includes('verify-otp'), {
  timeout: 15000,
});

await page.context().storageState({ path: milkywaySessionStorageFilePath });

console.log(`Login succeeded. Session saved to ${milkywaySessionStorageFilePath}.`);
console.log('Run: pnpm run e2e-test-milkyway');

await context.close();
