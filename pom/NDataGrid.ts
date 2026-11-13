import { type Locator, type Page } from '@playwright/test';

export class NDataGrid {
  public readonly element: Locator;
  public readonly tableFooter: Locator;

  private readonly searchRow: Locator;
  private readonly searchInput: Locator;
  private readonly tableRows: Locator;

  constructor({ page, tableTestId }: { page: Page; tableTestId: string }) {
    const element = page.getByTestId(tableTestId);

    this.element = element;

    this.searchRow = element.locator('.NDataGrid-SearchInput');
    this.searchInput = this.searchRow.getByRole('textbox', {
      name: /search/i,
    });

    this.tableRows = element.locator('tbody tr');

    this.tableFooter = element.locator('.v-data-table-footer__info');
  }

  // Rendered column headers - the source of truth for which columns are visible
  public get columnHeaders(): Locator {
    return this.element.locator('thead th');
  }

  // Waits for the table to finish loading
  public async waitTillLoaded(): Promise<void> {
    // Just to be safe; make sure table is visible before running state checks
    await this.element.waitFor({ state: 'visible' });

    // Wait for the loading class to be removed from the table element
    await this.element
      .locator(':scope.v-data-table--loading')
      .waitFor({ state: 'detached' });

    // Wait for skeleton loaders to disappear
    await this.element
      .locator('.v-skeleton-loader')
      .waitFor({ state: 'detached' });
  }

  public async columnHeaderTitles(): Promise<string[]> {
    const titles = await this.columnHeaders.allInnerTexts();

    return titles.map((title) => title.trim()).filter(Boolean);
  }

  // Cells of a column addressed by its header text rather than a fixed index, so the
  // locator survives columns being added, reordered or hidden via column preferences
  public async getCellsForColumn(columnTitle: string): Promise<Locator> {
    const titles = await this.columnHeaderTitles();
    const columnIndex = titles.indexOf(columnTitle);

    if (columnIndex === -1) {
      throw new Error(
        `Column "${columnTitle}" is not rendered. Visible columns: ${titles.join(', ')}`,
      );
    }

    return this.element.locator(`tbody tr td:nth-child(${columnIndex + 1})`);
  }

  public getFirstRow(): Locator {
    return this.getNthRow(0);
  }

  public getNthRow(n: number): Locator {
    return this.element.locator('tbody tr').nth(n);
  }

  public async clickNthRow(index: number): Promise<void> {
    await this.getNthRow(index).click();
  }

  public async clickFirstRow(): Promise<void> {
    await this.clickNthRow(0);
  }

  // Fills the search input with the given search term
  public async search(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
  }

  // will fail if search input is empty - clear button isn't there
  public async clearSearch(): Promise<void> {
    const { searchRow } = this;

    const clearButton = searchRow.getByRole('button', { name: 'clear' });

    await clearButton.click();
  }

  // Returns a row locator filtered by text content
  public getRowByText = (rowText: string): Locator =>
    this.tableRows.filter({ hasText: rowText });
}
