import type { Locator, Page } from '@playwright/test';

/**
 * Page object for the ProviderSelect dropdown.
 *
 * ProviderSelect renders a bespoke VMenu panel (ProviderSelectPanel) with a search
 * field and a list of provider rows, rather than a Vuetify VSelect overlay. That
 * means it can't be driven through {@link NSelect}: there is no `.v-select__content`
 * overlay and the options are list rows, not elements with an `option` role.
 */
export class ProviderSelect {
  public readonly searchInput: Locator;
  public readonly options: Locator;

  private readonly element: Locator;
  private readonly panel: Locator;

  constructor({ testId, page }: { testId: string; page: Page }) {
    this.element = page.getByTestId(testId);

    this.panel = page.locator(
      '.v-overlay--active .v-overlay__content .ProviderSelectPanel',
    );

    this.searchInput = this.panel.getByPlaceholder('Search by provider name');

    this.options = this.panel.locator('.ProviderSelectPanel-Row');
  }

  // opens or closes the select panel
  public async togglePanel(): Promise<void> {
    await this.element.click();
  }

  private async selectOption(optionLabel: string): Promise<void> {
    // The panel's initial (unfiltered) row list can still be mounting right
    // after the panel opens; filling the search box before that finishes
    // sometimes doesn't reach the component's search watcher, and the panel
    // never narrows down — wait for at least one row first.
    await this.options.first().waitFor({ state: 'visible' });

    await this.searchInput.fill(optionLabel);

    await this.options.filter({ hasText: optionLabel }).first().click();
  }

  // For a multi-select (`:multiple="true"`) the panel stays open after each pick,
  // so select every option and then close the panel explicitly
  public async multiSelectOptions(optionLabels: string[]): Promise<void> {
    await this.togglePanel();

    for (const optionLabel of optionLabels) {
      await this.selectOption(optionLabel);
    }

    await this.togglePanel();
  }

  // For a single-select (`:multiple="false"`) picking an option auto-closes the panel.
  public async singleSelectOption(optionLabel: string): Promise<void> {
    await this.togglePanel();

    await this.selectOption(optionLabel);
  }

  /**
   * Picks whichever provider the panel lists first.
   *
   * For tests that only need *a* provider (e.g. the Explorer's Configured Assignments
   * category gates its filters behind provider selection) this avoids hardcoding a
   * provider name that differs per environment.
   */
  public async selectFirstOption(): Promise<string> {
    await this.togglePanel();

    const firstOption = this.options.first();
    await firstOption.waitFor({ state: 'visible' });

    const label = (await firstOption.innerText()).trim();
    await firstOption.click();

    return label;
  }
}
