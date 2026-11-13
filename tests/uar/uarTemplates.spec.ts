import { expect } from '@playwright/test';
import { NSelect } from '../../pom/NSelect.js';
import { NDataGrid } from '../../pom/NDataGrid.js';
import { ProviderSelect } from '../../pom/ProviderSelect.js';
import { SideNav } from '../../pom/SideNav.js';
import { test } from '../../fixtures/index.js';
import { milkywaySessionStorageFilePath } from '../../scripts/milkyway-auth/constants.mjs';
import {
  getTemplateName,
  identitiesEmails,
  scopeProviderName,
  UarCampaignTemplateListViewTestId,
} from './uarTemplates.utils.js';

/**
 * Pre-requisites: run against the milkyway tenant (see README's manual OTP relay steps)
 * with Ashley Porter's session, and a "Milkyway AWS Organization" provider present.
 *
 * Covers Template CRUD only (create / verify / delete) for a single-owner template — the
 * simplest campaign-template shape. Campaign lifecycle (create/start/activate) is a
 * separate spec (uarCampaignLifecycle.spec.ts), built once this is green.
 */

let templateName: string;

test.describe.serial('UAR Campaign Templates', () => {
  test.beforeEach(async ({ page, browserName }) => {
    templateName = getTemplateName(browserName);
    await page.goto('/');
  });

  test.afterAll('remove template if creation test left it behind', async ({
    browser,
  }) => {
    // browser.newPage() (unlike the page/context fixtures) does not inherit the
    // project's storageState, so it lands unauthenticated without this.
    const page = await browser.newPage({
      storageState: milkywaySessionStorageFilePath,
    });

    await page.goto('/');
    await new SideNav(page).goToAdminUarTab('Campaign Templates');

    const table = new NDataGrid({
      page,
      tableTestId: UarCampaignTemplateListViewTestId,
    });

    await table.search(templateName);
    await table.waitTillLoaded();

    const templateRow = table.getRowByText(templateName);

    if (await templateRow.isVisible()) {
      await templateRow.locator('.NActionMenu-ActivatorButton').click();
      await page.getByRole('menu').getByText('Remove Template').click();
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Delete' })
        .click();
    }

    await page.close();
  });

  test('Create single-owner campaign template', async ({
    page,
    navigation,
  }) => {
    await navigation.goToAdminUarTab('Campaign Templates');

    const table = new NDataGrid({
      page,
      tableTestId: UarCampaignTemplateListViewTestId,
    });

    await table.search(templateName);
    await table.waitTillLoaded();

    const templateRow = table.getRowByText(templateName);

    await expect(
      templateRow,
      `${templateName} already available. Test environment is dirty.`,
    ).toBeHidden();

    await page.getByText('New Template').click();

    // Template form opens as a slideout panel (rendered as VDialog)
    const createTemplateDialog = page.getByRole('dialog');

    await expect(createTemplateDialog).toBeVisible();

    const ownersSelect = new NSelect({
      testId: 'CampaignTemplateUarOwnersSelect',
      page,
    });

    await createTemplateDialog
      .getByPlaceholder('Display name for this campaign template')
      .fill(templateName);

    await ownersSelect.multiSelectOptions([identitiesEmails.currentUser]);

    const campaignTypeSelect = new NSelect({
      testId: 'CampaignTypeSelect',
      page,
    });

    await campaignTypeSelect.toggleSelectPopover();
    await campaignTypeSelect.options.getByText('Role Assignment').click();

    await createTemplateDialog.getByTestId('CampaignScopeActionLink').click();

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

    // Reviewer configuration is required; new templates don't pre-populate a default level
    await createTemplateDialog
      .getByRole('button', { name: 'Add level' })
      .click();

    const reviewerSchemeDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByText('Reviewer Selection Policy') });
    await expect(reviewerSchemeDialog).toBeVisible();

    await reviewerSchemeDialog.getByRole('button', { name: 'Apply' }).click();
    await reviewerSchemeDialog.waitFor({ state: 'detached' });

    await createTemplateDialog.getByRole('button', { name: 'Save' }).click();

    await createTemplateDialog.waitFor({ state: 'detached' });

    await table.waitTillLoaded();

    await expect(page.locator(`td:has-text("${templateName}")`)).toBeVisible();
  });

  test('Delete campaign template', async ({ page, navigation }) => {
    await navigation.goToAdminUarTab('Campaign Templates');

    const table = new NDataGrid({
      page,
      tableTestId: UarCampaignTemplateListViewTestId,
    });

    await table.search(templateName);
    await table.waitTillLoaded();

    const templateRow = table.getRowByText(templateName);

    await expect(
      templateRow,
      `${templateName} not found. Create test must run first.`,
    ).toBeVisible();

    await templateRow.locator('.NActionMenu-ActivatorButton').click();
    await page.getByRole('menu').getByText('Remove Template').click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog.getByText('Are you sure?')).toBeVisible();

    await confirmDialog.getByRole('button', { name: 'Delete' }).click();
    await confirmDialog.waitFor({ state: 'detached' });

    await table.waitTillLoaded();

    await expect(templateRow).toBeHidden();
  });
});
