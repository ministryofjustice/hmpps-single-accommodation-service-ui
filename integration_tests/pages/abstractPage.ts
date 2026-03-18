import { expect, type Locator, type Page } from '@playwright/test'
import { StatusCard } from '@sas/ui'
import { TimelineEntry } from '@govuk/ui'
import { formatDate } from '../../server/utils/dates'

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

  async clickLink(text: string | RegExp, container?: Locator): Promise<void> {
    await (container || this.page).getByRole('link', { name: text }).click()
  }

  async completeInputByLabel(label: string, value: string) {
    await this.page.getByRole('textbox', { name: label }).fill(value)
  }

  async completeDateInputByLabel(label: string, value: string) {
    const [year, month, day] = value.split('T')[0].split('-')
    const fieldset = this.page.getByRole('group', { name: label })
    await fieldset.getByLabel('Day').fill(day)
    await fieldset.getByLabel('Month').fill(month)
    await fieldset.getByLabel('Year').fill(year)
  }

  async selectAutocompleteByLabel(label: string, value: string) {
    const input = this.page.getByRole('combobox', { name: label })
    await input.fill(value)
    await this.page.getByRole('option', { name: value, exact: true }).click()
  }

  async selectRadioByLabel(label: string) {
    await this.page.getByRole('radio', { name: label }).check()
  }

  async selectOptionByLabel(label: string, value: string) {
    await this.page.getByRole('combobox', { name: label }).selectOption(value)
  }

  async clearInputByLabel(label: string) {
    await this.completeInputByLabel(label, '')
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

    const values = Array.isArray(value) ? value.filter(Boolean) : [value]
    for await (const item of values) {
      await expect(summaryItem).toContainText(item)
    }
  }

  getCard(title: string) {
    return this.page.locator('.sas-card', {
      has: this.page.getByRole('heading', { name: title }),
    })
  }

  async shouldShowCard(title: string, cardData: StatusCard) {
    const card = this.getCard(title)

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

  async shouldShowGenericErrorMessage(message: string) {
    await expect(this.page.getByText('There is a problem')).toBeVisible()

    await expect(this.page.locator('.govuk-error-summary__body')).toContainText(message)
  }

  async shouldShowBanner(text: string) {
    return expect(this.page.getByRole('alert')).toContainText(text)
  }

  async verifyTextInput(label: string, value: string) {
    await expect(this.page.getByRole('textbox', { name: label })).toHaveValue(value)
  }

  async verifyRadioInput(label: string) {
    await expect(this.page.getByRole('radio', { name: label })).toBeChecked()
  }

  async verifySelectInput(label: string, value: string) {
    await expect(this.page.getByRole('combobox', { name: label })).toHaveValue(value)
  }

  async shouldShowTimelineEntry(entry: TimelineEntry) {
    const { label, byline, datetime, html } = entry

    const timelineEntry = this.page.locator('.moj-timeline__item', {
      has: this.page.getByRole('heading', { name: label.text }),
    })

    if (byline) {
      await expect(timelineEntry.getByText(`by ${byline.text}`)).toBeVisible()
    }
    if (datetime) {
      // TODO: This only matches the date portion -- check time also
      await expect(timelineEntry.getByRole('time')).toContainText(formatDate(datetime.timestamp))
    }

    expect(await timelineEntry.locator('.moj-timeline__description').innerHTML()).toEqual(html)
  }
}
