// Step 1 of the manual milkyway login relay.
//
// Usage (from packages/uar-e2e):
//   node scripts/milkyway-auth/requestOtp.mjs
//
// Submits the login email, which sends a fresh 6-digit code to that inbox.
// The browser profile is persisted to disk (persistentProfileDir) so step 2
// (verifyOtp.mjs), run as a separate process once a human has the code, reuses
// the same session.
import { chromium } from '@playwright/test';
import { config } from 'dotenv';
import { persistentProfileDir, getMilkywayEnv } from './constants.mjs';

config();

const { appUrl, username } = getMilkywayEnv();

const context = await chromium.launchPersistentContext(persistentProfileDir, {
  headless: true,
});
const page = context.pages()[0] ?? (await context.newPage());

await page.goto(`${appUrl}/#/login?redirectTo=/my/work`, {
  waitUntil: 'networkidle',
});

await page.locator('input[type=email]').fill(username);
await page.getByRole('button', { name: 'Sign in with email' }).click();
await page.waitForURL(/verify-otp/);

console.log(`OTP requested for ${username}.`);
console.log(
  'Once you have the code, run: node scripts/milkyway-auth/verifyOtp.mjs <code>',
);

await context.close();
