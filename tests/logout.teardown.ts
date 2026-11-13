/* eslint-disable playwright/expect-expect */
import { test } from '@playwright/test';

import { sessionStorageFilePath } from '../utils/constants.js';

test('logout', async ({ page }) => {
  await page.goto('/');

  const currentUserMenu = page.getByTestId('SideNav-CurrentUserMenu');

  // if the user menu is not visible, assume the user is not logged in and skip logout
  try {
    await currentUserMenu.waitFor({ timeout: 5000 });
  } catch (e: unknown) {
    console.log('User is not logged in, skipping logout.');
    return;
  }

  await currentUserMenu.click();
  await page.getByTestId('CurrentUserMenu-LogoutBtn').click();
  await page.waitForURL(`${process.env.APP_URL}/#/login`);

  // update stored session information to reflect logout
  await page.context().storageState({ path: sessionStorageFilePath });
});
