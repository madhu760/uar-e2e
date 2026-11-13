import type { Locator, Page } from '@playwright/test';

export const getCampaignName = (browserName: string): string =>
  `${browserName}-uar-e2e-flt-campaign-${Math.random().toString(36).slice(2, 8)}`;

// Real template in this tenant, type Account Assignment — same one the
// Campaign Creation tests use.
export const existingTemplateName = 'Account_Temp';

// Real campaign owner present in this tenant with campaigns across several
// Campaign Types — confirmed live via the filter panel's own name list.
export const campaignOwnerName = 'Aaliyah Alexander';

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Drives the Completion Date Vuetify date picker to a date N months from
 * today and clicks it. The picker's day buttons are aria-labelled
 * "<Weekday>, <Month> <Day>, <Year>" — build the same string and click by it,
 * navigating forward with "Next month" however many months separate today's
 * displayed month from the target.
 */
export const pickCompletionDateMonthsFromNow = async (
  page: Page,
  dialog: Locator,
  monthsFromNow: number,
): Promise<Date> => {
  const dateField = dialog.getByPlaceholder('Pick a date');
  await dateField.click();

  const picker = page.locator('.v-overlay--active .v-overlay__content').last();
  await picker.getByRole('button', { name: 'Select month' }).waitFor({ state: 'visible' });

  const target = new Date();
  target.setMonth(target.getMonth() + monthsFromNow);

  const label = `${target.toLocaleString('en-US', { weekday: 'long' })}, ${target.toLocaleString(
    'en-US',
    { month: 'long' },
  )} ${target.getDate()}, ${target.getFullYear()}`;

  const curMonthName = await picker.getByRole('button', { name: 'Select month' }).innerText();
  const curYear = parseInt(await picker.getByRole('button', { name: 'Select year' }).innerText(), 10);
  const curMonthIdx = monthNames.findIndex((m) => curMonthName.startsWith(m));
  const monthDiff =
    target.getFullYear() * 12 + target.getMonth() - (curYear * 12 + curMonthIdx);

  for (let i = 0; i < monthDiff; i += 1) {
    await picker.getByRole('button', { name: 'Next month' }).click();
  }

  await picker.getByRole('button', { name: label }).click();

  return target;
};
