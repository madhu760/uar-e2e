import type { Locator, Page } from '@playwright/test';

export class NSelect {
  public readonly searchInput: Locator;
  public readonly options: Locator;

  private readonly page: Page;

  private readonly element: Locator;
  private readonly optionsOverlay: Locator;

  constructor({ testId, page }: { testId: string; page: Page }) {
    this.page = page;

    this.element = this.page.getByTestId(testId);

    this.optionsOverlay = this.page.locator(
      '.v-overlay--active .v-overlay__content.v-select__content',
    );

    this.searchInput = this.optionsOverlay.getByRole('textbox');

    this.options = this.optionsOverlay.getByRole('option');
  }

  // opens or closes the select popover
  public async toggleSelectPopover(): Promise<void> {
    await this.element.click();
  }

  // For a multi-select, use this to select the options as
  // it will not auto-close the select popover after selecting the options
  public async multiSelectOptions(optionLabels: string[]): Promise<void> {
    // open the select popover
    await this.toggleSelectPopover();

    for (const optionLabel of optionLabels) {
      await this.searchInput.fill(optionLabel);

      const optionElement = this.options.getByText(optionLabel);

      await optionElement.click();
    }

    // close the select popover
    await this.toggleSelectPopover();
  }

  // For a single select, use this to select the option as
  // it will auto-close the select popover after selecting the option
  public async singleSelectOption(optionLabel: string): Promise<void> {
    await this.toggleSelectPopover();

    await this.searchInput.fill(optionLabel);

    const optionElement = this.options.getByText(optionLabel);

    await optionElement.click();
  }
}
