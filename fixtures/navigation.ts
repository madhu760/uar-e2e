import { test as baseTest } from '@playwright/test';
import { SideNav } from '../pom/SideNav.js';

export const test = baseTest.extend<{ navigation: SideNav }>({
  navigation: async ({ page }, use) => {
    const navigation = new SideNav(page);
    await use(navigation);
  },
});
