import { expect, type Locator, type Page } from '@playwright/test'
import { StatusCard } from '@sas/ui'

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
        has: this.page.locator('.govuk-summary-list__key').getByText(key, { exact: true }),
      })
      .locator('.govuk-summary-list__value')

    const values = Array.isArray(value) ? value : [value]
    for await (const item of values) {
      await expect(summaryItem).toContainText(item)
    }
  }

  async shouldShowCard(title: string, cardData: StatusCard) {
    const card = this.page.locator('.sas-card', { hasText: title })

    if (cardData.inactive) {
      await expect(card).toHaveClass(/sas-card--inactive/)
    }

    await expect(card.getByRole('heading', { name: cardData.heading })).toBeVisible()

    if (cardData.status) {
      const tag = card.locator('.govuk-tag', { hasText: cardData.status.text })
      await expect(tag).toBeVisible()

      if (cardData.status.colour) {
        await expect(tag).toHaveClass(`govuk-tag govuk-tag--${cardData.status.colour}`)
      }
    }

    for await (const detail of cardData.details || []) {
      await this.shouldShowSummaryItem(detail.key.text, detail.value.text, card)
    }

    for await (const link of cardData.links || []) {
      await expect(card.getByRole('link', { name: link.text })).toHaveAttribute('href', link.href)
    }
  }
}
