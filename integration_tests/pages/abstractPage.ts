import { expect, type Locator, type Page } from '@playwright/test'
import { StatusCard } from '@sas/ui'

export default class AbstractPage {
  readonly page: Page

  header: Locator

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

  static async verifyOnPage<T extends AbstractPage>(
    this: new (page: Page, ...args: unknown[]) => T,
    page: Page,
    ...args: unknown[]
  ): Promise<T> {
    const abstractPage = new this(page, ...args)
    await expect(abstractPage.header).toBeVisible()
    return abstractPage
  }

  async signOut() {
    await this.signoutLink.first().click()
  }

  async clickButton(buttonText: string) {
    await this.page.getByRole('button', { name: buttonText }).click()
  }

  async clickLink(text: string | RegExp): Promise<void> {
    await this.page.getByRole('link', { name: text }).click()
  }

  async completeInputByLabel(label: string, value: string) {
    const input = this.page.getByLabel(label)
    await input.fill(value)
  }

  async selectRadioByLabel(label: string) {
    const radio = this.page.getByLabel(label, { exact: true })
    await radio.check()
  }

  async clearInputByLabel(label: string) {
    const input = this.page.getByLabel(label)
    await input.fill('')
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
    const card = this.page.locator('.sas-card', {
      has: this.page.getByRole('heading', { name: title }),
    })

    if (cardData.inactive) {
      await expect(card).toHaveClass(/sas-card--inactive/)
    }

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

  async shouldShowErrorMessagesForFields(errorMessages: Record<string, string>) {
    await expect(this.page.getByText('There is a problem')).toBeVisible()

    const errorSummary = this.page.locator('.govuk-error-summary__body')

    for await (const [field, errorMessage] of Object.entries(errorMessages)) {
      await expect(errorSummary.getByRole('link', { name: errorMessage })).toHaveAttribute('href', `#${field}`)
      await expect(this.page.locator(`#${field}-error`)).toContainText(errorMessage)
    }
  }

  async verifyTextInputByName(name: string, value: string) {
    await expect(this.page.getByLabel(name)).toHaveValue(value)
  }

  async verifyRadioInputByName(name: string) {
    await expect(this.page.getByLabel(name, { exact: true })).toBeChecked()
  }
}
