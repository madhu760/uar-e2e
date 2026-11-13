// Random suffix avoids collisions with a same-named leftover from an earlier
// interrupted run (real API rejects a duplicate template name outright).
export const getTemplateName = (browserName: string): string =>
  `${browserName} - UAR e2e test - Single Owner Template - ${Math.random().toString(36).slice(2, 8)}`;

export const identitiesEmails = {
  // Login email (Ashley.porter@milkyway.com) is a separate auth alias from the
  // HR-synced identity record the UAR Owners select searches by.
  currentUser: 'ashley.porter@starburstandromedasecurity.onmicrosoft.com',
};

export const scopeProviderName = 'Milkyway AWS Organization';

export const UarCampaignTemplateListViewTestId = 'uar-campaign-template-list';
