import { expect, test as baseTest } from '@playwright/test';

/** App toast (`AppAlert.vue` / `useAlerts`). */
export type AppToast = {
  expectMessage(pattern: string | RegExp): Promise<void>;
  /** Clears visible toast so the same alert key can fire again (`useAlerts` de-dupes by key). */
  dismiss(): Promise<void>;
  /**
   * Clears every visible toast, tolerating none being left.
   *
   * Prefer this over {@link dismiss} when a flow raises several alerts, or when the
   * alert may already have auto-expired: alerts are `VSnackbar`s on Vuetify's default
   * timeout (~5s), so a fixed `dismiss` can race with the timeout and fail on a
   * missing close button.
   */
  dismissAll(): Promise<void>;
};

export const test = baseTest.extend<{ toast: AppToast }>({
  toast: async ({ page }, use) => {
    const message = page.locator('.AppAlert-MessageText');
    const closeButtons = page.locator('.AppAlert-CloseBtn');
    const toast: AppToast = {
      async expectMessage(pattern: string | RegExp): Promise<void> {
        await expect(message.getByText(pattern)).toBeVisible();
      },
      async dismiss(): Promise<void> {
        await page.locator('.AppAlert-CloseBtn').click();
        await expect(message).toHaveCount(0);
      },
      async dismissAll(): Promise<void> {
        // Bounded: each click removes one alert, and auto-expiry can remove them
        // concurrently, so a missing button is a success rather than a failure.
        for (let attempt = 0; attempt < 5; attempt++) {
          if ((await closeButtons.count()) === 0) return;

          await closeButtons
            .first()
            .click({ timeout: 2000 })
            .catch(() => undefined);
        }
      },
    };
    await use(toast);
  },
});
