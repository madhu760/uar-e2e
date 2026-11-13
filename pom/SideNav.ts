import type { Locator, Page } from '@playwright/test';

type AdminViewsLabels = 'User Access Reviews' | 'Human Identities';
type MyViewLabels = 'User Access Reviews';
type UarTabLabels = 'Ongoing Campaigns' | 'Campaign Templates';
const PersonalSectionTestId = 'SideNav-PersonalSpaceSection';

export class SideNav {
  public readonly element: Locator;

  constructor(private page: Page) {
    this.element = page.locator('.SideNav');
  }

  public goToAdminView(view: AdminViewsLabels): Promise<void> {
    return this.element
      .locator(
        `.SideNavAccordion:not([data-testid="${PersonalSectionTestId}"]) a`,
      )
      .getByText(view, { exact: true })
      .click();
  }

  public goToMyView(view: MyViewLabels): Promise<void> {
    return this.element
      .getByTestId(PersonalSectionTestId)
      .locator(`a`)
      .getByText(view, { exact: true })
      .click();
  }

  // The User Access Reviews section lands on the Dashboard tab, which renders
  // neither the campaigns grid nor the templates grid — always pick the tab the
  // test needs rather than relying on the section's default landing route.
  public async goToAdminUarTab(tab: UarTabLabels): Promise<void> {
    await this.goToAdminView('User Access Reviews');

    await this.page.getByRole('tab', { name: tab, exact: true }).click();
  }

  public async goToHumanIdentity(humanIdentityName: string): Promise<void> {
    await this.goToAdminView('Human Identities');

    await this.page.getByText('List').click();

    await this.page
      .getByPlaceholder('Search by Name, Email, or Username')
      .fill(humanIdentityName);

    await this.page
      .locator(`tr`)
      .getByText(humanIdentityName, { exact: true })
      .first()
      .click();
  }
}
