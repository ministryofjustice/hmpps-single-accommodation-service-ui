import { expect, type Locator, type Page } from '@playwright/test'

export default class AbstractPage {
  readonly page: Page

  /** user name that appear in header */
  readonly usersName: Locator

  /** phase banner that appear in header */
  readonly phaseBanner: Locator

  /** link to sign out */
  readonly signoutLink: Locator

  /** link to manage user details */
  readonly manageUserDetails: Locator

  /** button to open the account/user menu */
  readonly userMenuToggle: Locator

  protected constructor(page: Page) {
    this.page = page
    this.phaseBanner = page.getByTestId('header-phase-banner')
    this.usersName = page.getByTestId('header-user-name')
    this.userMenuToggle = page.getByTestId('header-user-menu-toggle')
    this.signoutLink = page.getByText('Sign out')
    this.manageUserDetails = page.getByTestId('manageDetails')
  }

  async signOut() {
    await this.userMenuToggle.first().click()
    await this.signoutLink.first().click()
  }

  async clickManageUserDetails() {
    await this.userMenuToggle.first().click()
    await this.manageUserDetails.first().click()
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
