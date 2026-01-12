import { expect, type Locator, type Page } from '@playwright/test'

export default class AbstractPage {
  readonly page: Page

  /** user name that appear in header */
  readonly usersName: Locator

  /** link to sign out */
  readonly signoutLink: Locator

  /** button to open the account/user menu */
  readonly userMenuToggle: Locator

  protected constructor(page: Page) {
    this.page = page
    this.usersName = page.getByTestId('header-user-name')
    this.signoutLink = page.getByText('Sign out')
  }

  async signOut() {
    await this.signoutLink.first().click()
  }

  async shouldShowTableHeaders(headers: string[]) {
    for await (const header of headers) {
      await expect(this.page.getByRole('columnheader', { name: header })).toBeVisible()
    }
  }

  async shouldShowSummaryItem(key: string, value: string | string[], container?: Locator) {
    const summaryItem = (container || this.page)
      .locator('.govuk-summary-list__row', {
        has: this.page.locator('.govuk-summary-list__key', { hasText: key }),
      })
      .locator('.govuk-summary-list__value')

    const values = Array.isArray(value) ? value : [value]
    for await (const item of values) {
      await expect(summaryItem).toContainText(item)
    }
  }
}
