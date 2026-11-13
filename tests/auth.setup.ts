/* eslint-disable playwright/expect-expect */
import { test } from '@playwright/test';

import { sessionStorageFilePath } from '../utils/constants.js';
import { performLogin } from '../utils/login.js';

test('login to app', async ({ page }) => {
  // Login is slow due to SSO code verification; the global 90s timeout covers this.
  await page.goto('/');

  await performLogin(page);

  // Wait for navigation to dashboard after login
  await page.waitForURL(`${process.env.APP_URL}/#/system-dashboard`);

  // Store user's session information including cookies and localstorage.
  await page.context().storageState({ path: sessionStorageFilePath });
});
