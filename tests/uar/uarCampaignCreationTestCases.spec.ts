import { expect } from '@playwright/test';
import { test } from '../../fixtures/index.js';
import { getCampaignName, existingTemplateName } from './uarCampaigns.utils.js';

/**
 * Automates the CAMPAIGN CREATION test cases (first batch: TC_UAR_CMP_01-05)
 * against the test environment (see README's manual OTP relay steps, testenv
 * config). Each test chains off the campaign the previous one created/started —
 * run in order, cleans itself up at the end via Cancel + Delete Campaign.
 */

let campaignName: string;

test.describe.serial('UAR Campaign Creation Test Cases', () => {
  test.beforeEach(async ({ page, navigation, browserName }) => {
    campaignName ??= getCampaignName(browserName);
    await page.goto('/', { waitUntil: 'networkidle' });
    await navigation.goToAdminUarTab('Ongoing Campaigns');
    // Page briefly logs "feature flags are not available" / "identity-details
    // API call hasn't gone through yet" right after navigation — give those
    // in-flight calls a moment to settle before interacting.
    await page.waitForTimeout(1500);
  });

  test.afterAll('cancel the test campaign', async ({ browser }) => {
    const page = await browser.newPage({
      storageState: '.playwright/.auth/testenv-session.json',
    });

    await page.goto('/#/uar-campaigns', { waitUntil: 'networkidle' });
    console.log('[cleanup] navigated, url:', page.url());
    await page.getByRole('tab', { name: 'Ongoing Campaigns', exact: true }).click();
    await page.waitForTimeout(1500);

    // The default Campaign Status filter doesn't include every status (e.g.
    // "Ready", which this campaign reaches by the time this runs) — without
    // clearing it the row is invisible and cleanup silently no-ops.
    const clearFiltersButton = page.getByRole('button', { name: 'Clear' });
    const clearVisible = await clearFiltersButton.isVisible().catch(() => false);
    console.log('[cleanup] clear filters button visible:', clearVisible);
    if (clearVisible) {
      await clearFiltersButton.click();
      await page.waitForTimeout(1500);
    }

    await page.getByPlaceholder('Search by Campaign Name').fill(campaignName);
    await page.waitForTimeout(1500);

    const row = page.locator('tr', { hasText: campaignName });
    const rowMenuButton = row.locator(
      '.NActionMenu-ActivatorButton, button[aria-haspopup="menu"]',
    );
    const rowVisible = await row.isVisible().catch(() => false);
    console.log('[cleanup] row visible:', rowVisible, 'for', campaignName);
    // "Cancel Campaign" alone fully removes it (confirmed by hand: cancelling
    // a test campaign leaves no trace in Ongoing/Completed/Archived) — a
    // follow-up "Delete Campaign" finds no row left and only times out.
    if (rowVisible) {
      await rowMenuButton.first().click();
      await page.waitForTimeout(500);
      const menu = page.getByRole('menu');
      const hasCancelOption = await menu
        .getByText('Cancel Campaign')
        .isVisible()
        .catch(() => false);
      console.log('[cleanup] menu has Cancel Campaign:', hasCancelOption);
      if (hasCancelOption) {
        await menu.getByText('Cancel Campaign').click();
        await page
          .getByRole('dialog')
          .getByRole('button', { name: /Cancel Campaign/ })
          .click();
        // Closing the page immediately after this click aborted the in-flight
        // cancel request before it reached the server — confirmed by hand:
        // without this wait the campaign silently survives, no error anywhere.
        await page.waitForTimeout(3000);
        console.log('[cleanup] cancel confirmed and waited');
      } else if (await menu.getByText('Delete Campaign').isVisible().catch(() => false)) {
        // Draft campaigns have no Cancel option — Delete directly.
        await menu.getByText('Delete Campaign').click();
        await page
          .getByRole('dialog')
          .getByRole('button', { name: /Delete/ })
          .click();
        console.log('[cleanup] delete confirmed');
        await page.waitForTimeout(3000);
      }
    }

    await page.close();
  });

  test('TC_UAR_CMP_01: create a new UAR Campaign using an existing Template', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'New Campaign' }).click();

    const dialog = page.getByRole('dialog').filter({ hasText: 'Add New Campaign' });
    await expect(dialog).toBeVisible();

    // Neither field exposes an accessible label (confirmed via the DOM snapshot
    // on a prior failed run — bare unlabeled textboxes) — select positionally.
    await dialog.getByRole('textbox').nth(0).fill(campaignName);
    await dialog
      .getByRole('textbox')
      .nth(1)
      .fill('TC_UAR_CMP_01 automated test campaign');

    await dialog.getByRole('combobox').last().click({ force: true });
    const templateMenu = page.locator('.v-overlay--active .v-overlay__content').last();
    await templateMenu.getByText(existingTemplateName, { exact: true }).click();

    // Picking the template kicks off an async fetch that populates
    // Owners/Scope/Reviewers below — clicking Save before it lands makes the
    // save silently no-op (confirmed: without this wait the dialog never
    // closes and no toast or error ever appears).
    await page.waitForTimeout(1500);

    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(
      page.locator('.AppAlert-MessageText').getByText('Campaign created successfully'),
    ).toBeVisible({ timeout: 10000 });
    await dialog.waitFor({ state: 'detached' });

    await page.getByPlaceholder('Search by Campaign Name').fill(campaignName);
    await page.waitForTimeout(1000);

    const row = page.locator('tr', { hasText: campaignName });
    await expect(row.getByText('Draft', { exact: true })).toBeVisible();
  });

  test('TC_UAR_CMP_03: campaign auto-populates configuration from selected Template', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'New Campaign' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Add New Campaign' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('combobox').last().click({ force: true });
    const templateMenu = page.locator('.v-overlay--active .v-overlay__content').last();
    await templateMenu.getByText(existingTemplateName, { exact: true }).click();
    await page.waitForTimeout(1000);

    // Template picked — General/Scope/Reviewers/Revocation sections populate below
    // without any manual input.
    await dialog.getByRole('tab', { name: 'General', exact: true }).click();
    await expect(dialog.getByText('UAR Owners')).toBeVisible();
    await expect(dialog.getByText('Account Assignment', { exact: true })).toBeVisible();

    await dialog.getByRole('tab', { name: 'Scope', exact: true }).click();
    await expect(dialog.getByText('Campaign Scope')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Add new scope' })).toBeVisible();

    await dialog.getByRole('tab', { name: 'Reviewers', exact: true }).click();
    await expect(dialog.getByText('Level 1')).toBeVisible();
    await expect(dialog.getByText('approval required')).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
  });

  test('TC_UAR_CMP_05: mandatory field validation on campaign creation', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'New Campaign' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Add New Campaign' });
    await expect(dialog).toBeVisible();

    // Campaign Name left empty
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog.getByText('This field is required').first()).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
  });

  test('TC_UAR_CMP_02: manually start a Draft UAR Campaign', async ({
    page,
    toast,
  }) => {
    await page.getByPlaceholder('Search by Campaign Name').fill(campaignName);
    await page.waitForTimeout(1000);

    const row = page.locator('tr', { hasText: campaignName });
    await row.getByRole('button', { name: 'Start' }).click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog.getByText('Confirm Campaign Start')).toBeVisible();
    await confirmDialog.getByRole('button', { name: 'Start Campaign' }).click();

    await toast.expectMessage(`Campaign: ${campaignName} started successfully`);

    await page.getByPlaceholder('Search by Campaign Name').fill(campaignName);
    await page.waitForTimeout(1500);
    await expect(row.getByText('Preparing', { exact: true })).toBeVisible();
  });

  test('TC_UAR_CMP_04: campaign details navigation and tab rendering', async ({
    page,
  }) => {
    await page.getByPlaceholder('Search by Campaign Name').fill(campaignName);
    await page.waitForTimeout(1000);

    await page.getByText(campaignName, { exact: true }).click();

    await expect(page).toHaveURL(/uar-campaigns\/[^/]+\/dashboard/);
    await expect(page.getByText('Preparing', { exact: true }).first()).toBeVisible();

    // These are router-link tabs — aria-selected doesn't reliably reflect the
    // active one, so assert on the URL route segment instead (same approach
    // as the dashboard check above).
    const tabRoutes: [string, RegExp][] = [
      ['Review Sets', /review-sets/],
      ['Reviews', /\/reviews(\?|$)/],
      ['Notification History', /notification-history/],
    ];
    for (const [tabName, routePattern] of tabRoutes) {
      await page.getByRole('tab', { name: tabName, exact: true }).click();
      await expect(page).toHaveURL(routePattern);
    }
  });
});
