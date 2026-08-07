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
      .getByRole('link', {
        name: 'Add outcome',
      })
      .click()
  }

  async clickAddNewReferral() {
    await this.page
      .getByRole('link', {
        name: 'Add new referral',
      })
      .click()
  }

  async expectOutcomeAddedBanner() {
    await expect(
      this.page.getByRole('heading', {
        name: 'Outcome details added',
        level: 3,
      }),
    ).toBeVisible()
  }

  async returnToCaseDetails() {
    await this.page
      .getByRole('navigation', {
        name: 'Breadcrumb',
      })
      .getByRole('link')
      .last()
      .click()
  }
}
