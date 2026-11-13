// Random suffix avoids collisions with a same-named leftover from an earlier
// interrupted run (the real API rejects a duplicate template name outright).
export const getTemplateName = (browserName: string): string =>
  `${browserName}-uar-e2e-template-${Math.random().toString(36).slice(2, 8)}`;

export const identitiesEmails = {
  // Test env's identity domain differs from staging's — confirmed by search.
  currentUser: 'ashley.porter@milkyway.com',
};

// Real cloud provider confirmed present in this tenant. Note: the tenant's
// provider list changes over time (a prior "Milkyway AWS Organization"
// provider existed at one point and was gone the next session) — re-verify
// this name live if provider-selection tests start failing to find it.
// "milkyway-org-1" (a VCS/org-style entry, not a true cloud IAM provider)
// doesn't show up in the Role Assignment scope's provider list. Plain "AWS"
// substring-collides with "test aws"/"Test AWS"/"Test AWS 003" in the search
// results, but the provider panel lists "AWS" itself first among those
// matches, so `.filter({hasText}).first()` lands on it reliably. Confirmed
// live: has real accounts (Analytics, Corp, Development, Production, etc.) —
// needed for TC02. "Test AWS 003" has ZERO accounts (useful later for TC03).
export const scopeProviderName = 'AWS';

export const UarCampaignTemplateListViewTestId = 'uar-campaign-template-list';
