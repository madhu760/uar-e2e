import { expect } from '@playwright/test';
import { NSelect } from '../../pom/NSelect.js';
import { NDataGrid } from '../../pom/NDataGrid.js';
import { ProviderSelect } from '../../pom/ProviderSelect.js';
import { test } from '../../fixtures/index.js';
import {
  getTemplateName,
  identitiesEmails,
  scopeProviderName,
  UarCampaignTemplateListViewTestId,
} from './uarTemplatesTestenv.utils.js';

/**
 * Automates TC_UAR_TMPL_01/02/04/05 against the test environment
 * (app.test.andromedasecurity.com) — see README's manual OTP relay steps,
 * testenv config.
 *
 * This env's template modal uses a DIFFERENT tab layout from staging's
 * (confirmed by hand): tabs are General/Scope/Reviewers/Revocation/Advanced,
 * not General/Campaign Scope/Identity Filters/Reviewers/Revocation/Schedule/
 * Notification Settings/AI Analysis/Review Table Columns. Concretely:
 *   - the scope button is "Setup Campaign Scope", not "Add new scope +"
 *   - the reviewer-level dialog is titled "Add review level" (not "Reviewer
 *     Selection Policy"), its confirm button is "Add level" (not "Apply"),
 *     and the persona options are Identity/Manager/Scope owner/Scope Custodian
 *   - there is no standalone "Review Table Columns" tab — it's folded into an
 *     "Advanced settings" expandable section, which didn't expand on a
 *     straightforward click; TC_UAR_TMPL_09 is NOT automated here yet pending
 *     that
 *
 * NOT automated here (same reasons as the staging version):
 *   TC_UAR_TMPL_03 (no zero-account provider exists in this tenant),
 *   TC_UAR_TMPL_06/07/08 (no HI/NHI Identity Type sub-dropdown exists under
 *   Campaign Templates in either environment).
 */

test.describe('UAR Template Test Cases (test env)', () => {
  test.beforeEach(async ({ page, navigation }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await navigation.goToAdminUarTab('Campaign Templates');
    await page.waitForTimeout(1500);
  });

  test('TC_UAR_TMPL_01: create a new UAR Campaign Template', async ({
    page,
    toast,
    browserName,
  }) => {
    const templateName = getTemplateName(browserName);

    const table = new NDataGrid({
      page,
      tableTestId: UarCampaignTemplateListViewTestId,
    });

    await page.getByText('New Template').click();

    const dialog = page
      .getByRole('dialog')
      .filter({ hasText: 'Add User Access Review Campaign Template' });
    await expect(dialog).toBeVisible();

    await dialog
      .getByPlaceholder('Display name for this campaign template')
      .fill(templateName);
    await dialog
      .getByPlaceholder("Brief note on this template's purpose and scope")
      .fill('TC_UAR_TMPL_01 automated test template');

    const ownersSelect = new NSelect({
      testId: 'CampaignTemplateUarOwnersSelect',
      page,
    });
    await ownersSelect.multiSelectOptions([identitiesEmails.currentUser]);

    const campaignTypeSelect = new NSelect({ testId: 'CampaignTypeSelect', page });
    await campaignTypeSelect.toggleSelectPopover();
    await campaignTypeSelect.options.getByText('Account Assignment').click();

    await dialog.getByRole('button', { name: 'Setup Campaign Scope' }).click();
    const scopeDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('button', { name: 'Apply' }) });
    await expect(scopeDialog).toBeVisible();

    const scopeProviderSelect = new ProviderSelect({
      testId: 'ScopeProviderSelect',
      page,
    });
    await scopeProviderSelect.multiSelectOptions([scopeProviderName]);

    await scopeDialog.getByRole('button', { name: 'Apply' }).click();
    await scopeDialog.waitFor({ state: 'detached' });

    await dialog.getByRole('tab', { name: 'Reviewers', exact: true }).click();
    await dialog.getByRole('button', { name: 'Add review level' }).click();
    const reviewerDialog = page.getByRole('dialog').filter({ hasText: 'Fallback reviewer' });
    await expect(reviewerDialog).toBeVisible();
    // Don't assume "Manager" is pre-selected — unlike the isolated TC05 flow,
    // here Owners/Campaign Type/Scope were already configured first, and in
    // that state the dialog opened with no persona picked, so Add level
    // silently no-op'd (confirmed: the nested dialog stayed open indefinitely
    // with no error shown).
    await reviewerDialog.getByText('Manager', { exact: true }).click();
    await reviewerDialog.getByRole('button', { name: 'Add level' }).click();

    // Wait on the practical signal (the level actually landed) rather than
    // the nested dialog detaching — a dialog index/filter can briefly
    // double-match during its own close transition and never resolve.
    await expect(dialog.getByText('Level 1')).toBeVisible({ timeout: 10000 });

    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(
      page.locator('.AppAlert-MessageText').getByText('UAR campaign template added successfully.'),
    ).toBeVisible({ timeout: 10000 });

    await dialog.waitFor({ state: 'detached' });
    await table.waitTillLoaded();

    // Search before checking visibility: the real tenant has many templates,
    // so an unfiltered new row can land past page 1.
    await table.search(templateName);
    await table.waitTillLoaded();
    const templateRow = table.getRowByText(templateName);
    await expect(templateRow).toBeVisible();
    await templateRow.locator('.NActionMenu-ActivatorButton').click();
    await page.getByRole('menu').getByText('Remove Template').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  });

  test('TC_UAR_TMPL_02: scope provider selection loads Accounts options', async ({
    page,
  }) => {
    await page.getByText('New Template').click();
    const dialog = page
      .getByRole('dialog')
      .filter({ hasText: 'Add User Access Review Campaign Template' });
    await expect(dialog).toBeVisible();

    const campaignTypeSelect = new NSelect({ testId: 'CampaignTypeSelect', page });
    await campaignTypeSelect.toggleSelectPopover();
    await campaignTypeSelect.options.getByText('Role Assignment').click();

    await dialog.getByRole('button', { name: 'Setup Campaign Scope' }).click();
    const scopeDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('button', { name: 'Apply' }) });
    await expect(scopeDialog).toBeVisible();

    const scopeProviderSelect = new ProviderSelect({
      testId: 'ScopeProviderSelect',
      page,
    });
    await scopeProviderSelect.multiSelectOptions([scopeProviderName]);

    const accountsSelect = scopeDialog.getByPlaceholder(
      'All Accounts in selected provider (Applicable for cloud provider only)',
    );
    // Vuetify wraps this field with a decorative `data-no-activator` div that
    // deliberately doesn't open the menu — force past it to the real input.
    await accountsSelect.click({ force: true });

    // This field is a VAutocomplete (different overlay classes from NSelect's
    // VSelect), so use role-based lookup instead of a CSS class guess.
    await expect(page.getByRole('option').first()).toBeVisible();

    await scopeDialog.getByRole('button', { name: 'Cancel' }).click();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
  });

  test('TC_UAR_TMPL_04: mandatory field validation for Campaign Scope', async ({
    page,
  }) => {
    await page.getByText('New Template').click();
    const dialog = page
      .getByRole('dialog')
      .filter({ hasText: 'Add User Access Review Campaign Template' });
    await expect(dialog).toBeVisible();

    const campaignTypeSelect = new NSelect({ testId: 'CampaignTypeSelect', page });
    await campaignTypeSelect.toggleSelectPopover();
    await campaignTypeSelect.options.getByText('Role Assignment').click();

    await dialog.getByRole('button', { name: 'Setup Campaign Scope' }).click();
    const scopeDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('button', { name: 'Apply' }) });
    await expect(scopeDialog).toBeVisible();

    // Apply with no provider selected
    await scopeDialog.getByRole('button', { name: 'Apply' }).click();

    await expect(scopeDialog.getByText('This field is required')).toBeVisible();

    await scopeDialog.getByRole('button', { name: 'Cancel' }).click();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
  });

  test('TC_UAR_TMPL_05: add a multi-level Reviewer Selection Policy', async ({
    page,
  }) => {
    await page.getByText('New Template').click();
    const dialog = page
      .getByRole('dialog')
      .filter({ hasText: 'Add User Access Review Campaign Template' });
    await expect(dialog).toBeVisible();

    const campaignTypeSelect = new NSelect({ testId: 'CampaignTypeSelect', page });
    await campaignTypeSelect.toggleSelectPopover();
    await campaignTypeSelect.options.getByText('Role Assignment').click();

    await dialog.getByRole('tab', { name: 'Reviewers', exact: true }).click();
    await dialog.getByRole('button', { name: 'Add review level' }).click();

    const reviewerDialog = page.getByRole('dialog').filter({ hasText: 'Fallback reviewer' });
    await expect(reviewerDialog).toBeVisible();

    // "Manager" is the default-selected persona — confirm it's there, then
    // just confirm the level with it.
    await expect(reviewerDialog.getByText('Manager', { exact: true })).toBeVisible();
    await reviewerDialog.getByRole('button', { name: 'Add level' }).click();

    // Wait on the practical signal (the level actually landed) rather than
    // the nested dialog detaching — a dialog index/filter can briefly
    // double-match during its own close transition and never resolve.
    await expect(dialog.getByText('Level 1')).toBeVisible({ timeout: 10000 });

    await dialog.getByRole('button', { name: 'Cancel' }).click();
  });
});
