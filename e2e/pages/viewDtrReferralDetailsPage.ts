import { expect } from '@playwright/test'
import BasePage from './basePage'

export default class ViewDtrReferralDetailsPage extends BasePage {
  async expectPageToBeDisplayed() {
    await this.expectHeadingToBeDisplayed({
      name: 'Duty to Refer (DTR)',
      level: 1,
    })
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
