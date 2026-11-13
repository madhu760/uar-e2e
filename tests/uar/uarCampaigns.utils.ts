// Random suffix avoids collisions with a same-named leftover from an earlier
// interrupted run (the real API rejects a duplicate campaign name outright).
export const getCampaignName = (browserName: string): string =>
  `${browserName}-uar-e2e-campaign-${Math.random().toString(36).slice(2, 8)}`;

// Real template that exists in the test env tenant, type Account Assignment —
// matches TC_UAR_CMP_01's own suggested example name.
export const existingTemplateName = 'Account_Temp';
