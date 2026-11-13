import { expect } from '@playwright/test';
import { test } from '../../fixtures/index.js';
import {
  campaignOwnerName,
  existingTemplateName,
  getCampaignName,
  pickCompletionDateMonthsFromNow,
} from './ongoingCampaignFilters.utils.js';

/**
 * Automates the ONGOING CAMPAIGN FILTERS test cases (TC_UAR_FLT_01-07) against
 * the test environment, Milkyway tenant (see README's manual OTP relay steps,
 * testenv config).
 *
 * The filter bar above the Ongoing Campaigns grid (`GridFilters`) has four
 * filter chips — Campaign Owner (a person search), Campaign Status (preset
 * with a non-empty default selection), Campaign Type, Revocation — plus a
 * global "Clear" button. TC_FLT_01 through 06 each start from a clean filter
 * state (the `beforeEach` clicks the global Clear if it's visible) so the
 * tests don't depend on each other's filter state or run order.
 *
 * TC_FLT_07 is the exception: it creates and starts its own throwaway
 * campaign and cleans it up itself, independent of the filter tests.
 */

test.describe('Ongoing Campaign Filters Test Cases', () => {
  test.beforeEach(async ({ page, navigation }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await navigation.goToAdminUarTab('Ongoing Campaigns');
    await page.waitForTimeout(1500);

    const clearFiltersButton = page.locator('.GridFilters-ClearBtn');
    if (await clearFiltersButton.isVisible().catch(() => false)) {
      await clearFiltersButton.click();
      await page.waitForTimeout(1200);
    }
  });

  test('TC_UAR_FLT_01: apply single Campaign Owner filter', async ({ page }) => {
    const chips = page.locator('.BaseFilter-Chip');

    await chips.filter({ hasText: 'Campaign Owner' }).click();
    const panel = page.locator('.v-overlay--active .v-overlay__content').last();
    await panel.getByText(campaignOwnerName, { exact: true }).click();
    await panel.getByRole('button', { name: 'Apply' }).click();
    await page.waitForTimeout(1500);

    await expect(
      chips.filter({ hasText: 'Campaign Owner' }).getByText(campaignOwnerName),
    ).toBeVisible();

    const ownerCells = page.getByTestId('uar-campaign-list-view').locator('tbody tr td:nth-child(2)');
    const rowCount = await ownerCells.count();
    expect(rowCount).toBeGreaterThan(0);
    for (let i = 0; i < rowCount; i += 1) {
      await expect(ownerCells.nth(i)).toContainText(campaignOwnerName);
    }
  });

  test('TC_UAR_FLT_02: remove active filter tag', async ({ page }) => {
    const chips = page.locator('.BaseFilter-Chip');
    const ownerChip = chips.filter({ hasText: 'Campaign Owner' });

    await ownerChip.click();
    const panel = page.locator('.v-overlay--active .v-overlay__content').last();
    await panel.getByText(campaignOwnerName, { exact: true }).click();
    await panel.getByRole('button', { name: 'Apply' }).click();
    await page.waitForTimeout(1500);
    await expect(ownerChip.getByText(campaignOwnerName)).toBeVisible();

    // The chip's own close ("x") control, not the page-wide `close-chip`
    // testid shared by every filter chip that currently holds a value.
    await ownerChip.getByTestId('close-chip').click();
    await page.waitForTimeout(1500);

    await expect(ownerChip.getByText(campaignOwnerName)).not.toBeVisible();
    await expect(ownerChip).toHaveText('Campaign Owner');
  });

  test('TC_UAR_FLT_03: apply multiple Campaign Types filter', async ({ page }) => {
    const chips = page.locator('.BaseFilter-Chip');

    await chips.filter({ hasText: 'Campaign Type' }).click();
    const panel = page.locator('.v-overlay--active .v-overlay__content').last();
    await panel.getByText('Account Assignment', { exact: true }).click();
    await panel.getByText('Group Membership', { exact: true }).click();
    await panel.getByRole('button', { name: 'Apply' }).click();
    await page.waitForTimeout(1500);

    const typeChip = chips.filter({ hasText: 'Campaign Type' });
    await expect(typeChip.getByText('Account Assignment')).toBeVisible();
    await expect(typeChip.getByText('Group Membership')).toBeVisible();

    const typeCells = page
      .getByTestId('uar-campaign-list-view')
      .locator('tbody tr td:nth-child(1)');
    const rowCount = await typeCells.count();
    expect(rowCount).toBeGreaterThan(0);
    for (let i = 0; i < rowCount; i += 1) {
      const cellText = await typeCells.nth(i).innerText();
      expect(
        cellText.includes('Account Assignment') || cellText.includes('Group Membership'),
      ).toBe(true);
    }
  });

  test('TC_UAR_FLT_04: global Clear button resets all applied filters', async ({ page }) => {
    const chips = page.locator('.BaseFilter-Chip');

    await chips.filter({ hasText: 'Campaign Owner' }).click();
    let panel = page.locator('.v-overlay--active .v-overlay__content').last();
    await panel.getByText(campaignOwnerName, { exact: true }).click();
    await panel.getByRole('button', { name: 'Apply' }).click();
    await page.waitForTimeout(1000);

    await chips.filter({ hasText: 'Campaign Type' }).click();
    panel = page.locator('.v-overlay--active .v-overlay__content').last();
    await panel.getByText('Account Assignment', { exact: true }).click();
    await panel.getByRole('button', { name: 'Apply' }).click();
    await page.waitForTimeout(1000);

    await expect(chips.filter({ hasText: 'Campaign Owner' }).getByText(campaignOwnerName)).toBeVisible();
    await expect(chips.filter({ hasText: 'Campaign Type' }).getByText('Account Assignment')).toBeVisible();

    await page.locator('.GridFilters-ClearBtn').click();
    await page.waitForTimeout(1500);

    // A bare chip's text is just its own label — no selected value appended.
    await expect(chips.filter({ hasText: 'Campaign Owner' })).toHaveText('Campaign Owner');
    await expect(chips.filter({ hasText: 'Campaign Type' })).toHaveText('Campaign Type');
    await expect(chips.filter({ hasText: 'Revocation' })).toHaveText('Revocation');
  });

  test('TC_UAR_FLT_05: filter campaigns by Revocation strategy', async ({ page }) => {
    const chips = page.locator('.BaseFilter-Chip');
    const grid = page.getByTestId('uar-campaign-list-view');

    // The grid has no visible Revocation column (headers: Campaign Name,
    // Owners, Providers, Accesses, Reviewers, Due Date, Review Status,
    // Status) — the strategy isn't a cell to assert against directly, so
    // assert the chip reflects the selection and the grid reloads into a
    // valid state (rows or the empty-state message, never stuck loading).
    await chips.filter({ hasText: 'Revocation' }).click();
    const panel = page.locator('.v-overlay--active .v-overlay__content').last();
    await panel.getByText('Automated Revocation', { exact: true }).click();
    await panel.getByRole('button', { name: 'Apply' }).click();
    await page.waitForTimeout(1500);

    const revocationChip = chips.filter({ hasText: 'Revocation' });
    await expect(revocationChip.getByText('Automated Revocation')).toBeVisible();

    const hasRows = (await grid.locator('tbody tr').count()) > 0;
    const hasEmptyState = await grid
      .getByText('Filters or search terms are applied, but no records match your criteria.')
      .isVisible()
      .catch(() => false);
    expect(hasRows || hasEmptyState).toBe(true);
  });

  test('TC_UAR_FLT_06: no records found state for a non-matching filter combination', async ({
    page,
  }) => {
    const chips = page.locator('.BaseFilter-Chip');

    await chips.filter({ hasText: 'Campaign Owner' }).click();
    let panel = page.locator('.v-overlay--active .v-overlay__content').last();
    await panel.getByText(campaignOwnerName, { exact: true }).click();
    await panel.getByRole('button', { name: 'Apply' }).click();
    await page.waitForTimeout(1000);

    // Confirmed live: this owner has no Eligibility-type campaigns in this
    // tenant, so the combination always yields zero rows.
    await chips.filter({ hasText: 'Campaign Type' }).click();
    panel = page.locator('.v-overlay--active .v-overlay__content').last();
    await panel.getByText('Eligibility', { exact: true }).click();
    await panel.getByRole('button', { name: 'Apply' }).click();
    await page.waitForTimeout(1500);

    await expect(
      page
        .getByTestId('uar-campaign-list-view')
        .getByText('Filters or search terms are applied, but no records match your criteria.'),
    ).toBeVisible();
  });

  test('TC_UAR_FLT_07: create and track a 3-month ongoing campaign', async ({
    page,
    browserName,
  }) => {
    test.setTimeout(150000);
    const campaignName = getCampaignName(browserName);

    await page.getByRole('button', { name: 'New Campaign' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Add New Campaign' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('textbox').nth(0).fill(campaignName);
    await dialog.getByRole('textbox').nth(1).fill('TC_UAR_FLT_07 automated 3-month campaign');

    await pickCompletionDateMonthsFromNow(page, dialog, 3);

    await dialog.getByRole('combobox').last().click({ force: true });
    const templateMenu = page.locator('.v-overlay--active .v-overlay__content').last();
    await templateMenu.getByText(existingTemplateName, { exact: true }).click();
    // Picking the template auto-populates Owners/Scope/Reviewers below —
    // saving before that lands silently no-ops (same race documented in the
    // Campaign Creation tests).
    await page.waitForTimeout(1500);

    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(
      page.locator('.AppAlert-MessageText').getByText('Campaign created successfully'),
    ).toBeVisible({ timeout: 10000 });
    await dialog.waitFor({ state: 'detached' });

    // Save navigates straight to the new campaign's dashboard — come back to
    // the Ongoing Campaigns grid to drive it from there like the rest of the
    // suite.
    await page.goto('/#/uar-campaigns', { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'Ongoing Campaigns', exact: true }).click();
    await page.waitForTimeout(1500);

    await page.getByPlaceholder('Search by Campaign Name').fill(campaignName);
    await page.waitForTimeout(1500);
    const row = page.locator('tr', { hasText: campaignName });

    // Confirmed live: the Due Date column renders the completion date as a
    // relative label ("in 3mo") rather than an absolute date — this is the
    // "remaining duration reflects the 3-month timeline" signal.
    await expect(row).toContainText(/in 3mo/);
    await expect(row.getByText('Draft', { exact: true })).toBeVisible();

    await row.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByRole('dialog').getByText('Confirm Campaign Start')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Start Campaign' }).click();
    await page.waitForTimeout(3000);

    await page.getByPlaceholder('Search by Campaign Name').fill(campaignName);

    // Confirmed live: the status moves off "Draft" to "Preparing" within a
    // few seconds of starting. Reaching the literal "Review In Progress"
    // status the test case titles as "In Progress" takes longer than is
    // practical to wait for here — moving off "Draft" is the progress
    // signal this assertion checks for.
    await expect(row.getByText('Draft', { exact: true })).not.toBeVisible({ timeout: 10000 });

    // The review-completion percentage goes from "—" to a real number ("0%")
    // once the review set is built, on its own backend timer. The grid
    // doesn't live-poll this, and re-filling the search box with the same
    // text doesn't trigger a refetch either (no change event, since the
    // value doesn't change) — a full reload is what actually forces a fresh
    // fetch of the row's data.
    await expect(async () => {
      await page.reload({ waitUntil: 'networkidle' });
      await page.getByRole('tab', { name: 'Ongoing Campaigns', exact: true }).click();
      await page.getByPlaceholder('Search by Campaign Name').fill(campaignName);
      await expect(row).toContainText('0%', { timeout: 5000 });
    }).toPass({ timeout: 100000, intervals: [5000] });

    await expect(row).toContainText(/in 3mo/);

    // Cleanup: cancelling an active campaign fully removes it (confirmed by
    // hand elsewhere in this suite — no trace left in Ongoing/Completed/Archived).
    const menuButton = row.locator('.NActionMenu-ActivatorButton, button[aria-haspopup="menu"]');
    await menuButton.first().click();
    await page.waitForTimeout(500);
    const menu = page.getByRole('menu');
    await menu.getByText('Cancel Campaign').click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Cancel Campaign/ })
      .click();
    await page.waitForTimeout(3000);
  });
});
