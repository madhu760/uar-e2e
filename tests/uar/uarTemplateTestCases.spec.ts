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
} from './uarTemplates.utils.js';

/**
 * Automates the UAR-TEMPLATE test cases (TC_UAR_TMPL_01 through 09) against the
 * milkyway tenant (see README's manual OTP relay steps).
 *
 * NOT automated here — flagged back rather than guessed:
 *   TC_UAR_TMPL_03 — describes selecting a provider with zero accounts (e.g. "azure wif").
 *     No such provider exists in this tenant's real data (searched "wif" and "azure" —
 *     only a plain "Azure" cloud provider exists, with accounts). Needs either a
 *     fixture provider with no accounts, or a different provider name from whoever
 *     wrote the test case.
 *   TC_UAR_TMPL_06/07/08 — describe an Identity Type dropdown with HI-specific values
 *     (Employee, Contractor, Vendor, Third-Party) and NHI-specific values (Service
 *     Account, Bot, System User, API Key/Service Principal) that swap based on a
 *     Human/Non-Human Identities scope toggle. No such control exists under Campaign
 *     Templates: the closest matches are the "Identity Type" select (Human/Non-Human
 *     Identity only, no subtypes) and the "HR Type" filter (Employee/Contingent
 *     worker/Third Party/Unspecified — no NHI counterpart). These may belong to a
 *     different screen (the test case says "create/open a review set", not a
 *     template) — needs clarification on where this control actually lives.
 */

test.describe('UAR Template Test Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC_UAR_TMPL_01: create a new UAR Campaign Template', async ({
    page,
    navigation,
    toast,
    browserName,
  }) => {
    const templateName = `${getTemplateName(browserName)} - TC01`;

    await navigation.goToAdminUarTab('Campaign Templates');

    const table = new NDataGrid({
      page,
      tableTestId: UarCampaignTemplateListViewTestId,
    });

    await page.getByText('New Template').click();

    const dialog = page.getByRole('dialog');
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

    await dialog.getByTestId('CampaignScopeActionLink').click();
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

    await dialog.getByRole('button', { name: 'Add level' }).click();
    const reviewerSchemeDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByText('Reviewer Selection Policy') });
    await expect(reviewerSchemeDialog).toBeVisible();
    await reviewerSchemeDialog.getByRole('button', { name: 'Apply' }).click();
    await reviewerSchemeDialog.waitFor({ state: 'detached' });

    await dialog.getByRole('button', { name: 'Save' }).click();

    await toast.expectMessage('UAR campaign template added successfully.');

    await dialog.waitFor({ state: 'detached' });
    await table.waitTillLoaded();

    // Search before checking visibility: the real tenant has 50+ templates,
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
    navigation,
  }) => {
    await navigation.goToAdminUarTab('Campaign Templates');

    await page.getByText('New Template').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const campaignTypeSelect = new NSelect({ testId: 'CampaignTypeSelect', page });
    await campaignTypeSelect.toggleSelectPopover();
    await campaignTypeSelect.options.getByText('Role Assignment').click();

    await dialog.getByTestId('CampaignScopeActionLink').click();
    const scopeDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('button', { name: 'Apply' }) });
    await expect(scopeDialog).toBeVisible();

    const scopeProviderSelect = new ProviderSelect({
      testId: 'ScopeProviderSelect',
      page,
    });
    await scopeProviderSelect.multiSelectOptions([scopeProviderName]);

    const accountsField = scopeDialog.getByText(
      'Accounts (Configurable if exactly one provider is selected)',
    );
    await expect(accountsField).toBeVisible();

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
    navigation,
  }) => {
    await navigation.goToAdminUarTab('Campaign Templates');

    await page.getByText('New Template').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const campaignTypeSelect = new NSelect({ testId: 'CampaignTypeSelect', page });
    await campaignTypeSelect.toggleSelectPopover();
    await campaignTypeSelect.options.getByText('Role Assignment').click();

    await dialog.getByTestId('CampaignScopeActionLink').click();
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
    navigation,
  }) => {
    await navigation.goToAdminUarTab('Campaign Templates');

    await page.getByText('New Template').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const campaignTypeSelect = new NSelect({ testId: 'CampaignTypeSelect', page });
    await campaignTypeSelect.toggleSelectPopover();
    await campaignTypeSelect.options.getByText('Role Assignment').click();

    await dialog.getByRole('button', { name: 'Add level' }).click();

    const reviewerSchemeDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByText('Reviewer Selection Policy') });
    await expect(reviewerSchemeDialog).toBeVisible();

    await reviewerSchemeDialog.getByText('Manager', { exact: true }).click();
    await reviewerSchemeDialog.getByRole('button', { name: 'Apply' }).click();
    await reviewerSchemeDialog.waitFor({ state: 'detached' });

    // UarReviewLevelChip renders the ordinal ("1st") and "Level" as separate text nodes
    await expect(dialog.locator('.UarReviewLevelChip')).toContainText('1st');
    await expect(dialog.locator('.UarReviewLevelChip')).toContainText('Level');
    await expect(dialog.getByText('Approval Required')).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
  });

  test('TC_UAR_TMPL_09: Review Table Columns visibility & sortable configuration persists', async ({
    page,
    navigation,
    toast,
    browserName,
  }) => {
    const templateName = `${getTemplateName(browserName)} - TC09`;

    await navigation.goToAdminUarTab('Campaign Templates');

    const table = new NDataGrid({
      page,
      tableTestId: UarCampaignTemplateListViewTestId,
    });

    await page.getByText('New Template').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog
      .getByPlaceholder('Display name for this campaign template')
      .fill(templateName);

    const ownersSelect = new NSelect({
      testId: 'CampaignTemplateUarOwnersSelect',
      page,
    });
    await ownersSelect.multiSelectOptions([identitiesEmails.currentUser]);

    const campaignTypeSelect = new NSelect({ testId: 'CampaignTypeSelect', page });
    await campaignTypeSelect.toggleSelectPopover();
    await campaignTypeSelect.options.getByText('Role Assignment').click();

    await dialog.getByTestId('CampaignScopeActionLink').click();
    const scopeDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('button', { name: 'Apply' }) });
    const scopeProviderSelect = new ProviderSelect({
      testId: 'ScopeProviderSelect',
      page,
    });
    await scopeProviderSelect.multiSelectOptions([scopeProviderName]);
    await scopeDialog.getByRole('button', { name: 'Apply' }).click();
    await scopeDialog.waitFor({ state: 'detached' });

    await dialog.getByRole('button', { name: 'Add level' }).click();
    const reviewerSchemeDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByText('Reviewer Selection Policy') });
    await reviewerSchemeDialog.getByRole('button', { name: 'Apply' }).click();
    await reviewerSchemeDialog.waitFor({ state: 'detached' });

    // Jump to the Review Table Columns tab and toggle a non-mandatory column off
    await dialog.getByRole('tab', { name: 'Review Table Columns' }).click();

    const usernameRow = dialog.getByRole('row', { name: 'Username' });
    await usernameRow.locator('.v-switch input').click();

    // Confirm the toggle actually took client-side before saving, so a save-time
    // race is distinguishable from the click itself silently not registering.
    await expect(usernameRow.locator('.v-switch input')).not.toBeChecked();

    await dialog.getByRole('button', { name: 'Save' }).click();
    await toast.expectMessage('UAR campaign template added successfully.');
    await dialog.waitFor({ state: 'detached' });
    await table.waitTillLoaded();

    // Reopen and confirm the toggle persisted
    await table.search(templateName);
    await table.waitTillLoaded();
    const templateRow = table.getRowByText(templateName);
    await templateRow.click();

    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();
    await editDialog.getByRole('tab', { name: 'Review Table Columns' }).click();

    const reopenedUsernameRow = editDialog.getByRole('row', {
      name: 'Username',
    });
    await expect(
      reopenedUsernameRow.locator('.v-switch input'),
    ).not.toBeChecked();

    await editDialog.getByRole('button', { name: 'Cancel' }).click();

    // cleanup
    await table.search(templateName);
    await table.waitTillLoaded();
    await templateRow.locator('.NActionMenu-ActivatorButton').click();
    await page.getByRole('menu').getByText('Remove Template').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  });
});
