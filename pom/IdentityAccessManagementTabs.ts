import type { Page } from '@playwright/test';
import { NDataGrid } from './NDataGrid.js';

// Tabs on a Human Identity's detail page (reached via SideNav.goToHumanIdentity).
// Grid testids come from the `id` prop on each view's <ADataGrid>:
// IdentityRequestReviewsListView.vue and IdentityAccessRequestsListView.vue.
export class IdentityAccessManagementTabs {
  constructor(private page: Page) {}

  public async goToAssignedReviews(): Promise<NDataGrid> {
    await this.page.getByRole('tab', { name: 'Assigned Reviews' }).click();

    const grid = new NDataGrid({
      page: this.page,
      tableTestId: 'identity-request-reviews-list',
    });

    await grid.waitTillLoaded();

    return grid;
  }

  public async goToAccessRequests(): Promise<NDataGrid> {
    await this.page.getByRole('tab', { name: 'Access Requests' }).click();

    const grid = new NDataGrid({
      page: this.page,
      tableTestId: 'identity-access-requests-list',
    });

    await grid.waitTillLoaded();

    return grid;
  }
}
