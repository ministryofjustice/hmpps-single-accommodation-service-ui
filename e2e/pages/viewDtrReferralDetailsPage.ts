import { expect, Page } from '@playwright/test'

export default class ViewDtrReferralDetailsPage {
  constructor(private readonly page: Page) {}

  async expectPageToBeDisplayed() {
    await expect(
      this.page.getByRole('heading', {
        name: 'Duty to Refer (DTR)',
        level: 1,
      }),
    ).toBeVisible()
  }

  async clickAddOutcome() {
    await this.page
      .getByRole('button', {
        name: 'Add outcome',
      })
      .click()
  }

  async clickAddNewReferral() {
    await this.page
      .getByRole('button', {
        name: 'Add new referral',
      })
      .click()
  }

  async expectOutcomeAddedBanner() {
    await expect(
      this.page.getByLabel('Success').getByRole('heading', {
        name: 'Outcome details added',
        level: 3,
      }),
    ).toBeVisible()
  }

  async returnToCaseDetails() {
    const caseDetailsLink = this.page.locator('.govuk-breadcrumbs__link[href^="/cases/"]')

    const href = await caseDetailsLink.getAttribute('href')

    if (!href) {
      throw new Error('Case details breadcrumb link is missing')
    }

    await this.page.goto(href)
  }
}
