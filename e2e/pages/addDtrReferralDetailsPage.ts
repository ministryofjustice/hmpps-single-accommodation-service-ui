import { expect } from '@playwright/test'
import BasePage from './basePage'

type DateInput = {
  day: string
  month: string
  year: string
}

export default class AddDtrReferralDetailsPage extends BasePage {
  async expectPageToBeDisplayed() {
    await this.expectHeadingToBeDisplayed({
      name: /Add( new)? Duty to Refer \(DTR\) referral details/,
      level: 1,
    })
  }

  async enterSubmissionDate({ day, month, year }: DateInput) {
    await this.page.locator('#submissionDate-day').fill(day)
    await this.page.locator('#submissionDate-month').fill(month)
    await this.page.locator('#submissionDate-year').fill(year)
  }

  async selectLocalAuthority(localAuthority: string) {
    const localAuthorityInput = this.page.getByRole('combobox')

    await localAuthorityInput.fill(localAuthority)

    const matchingOption = this.page.getByRole('option', {
      name: new RegExp(localAuthority, 'i'),
    })

    await expect(matchingOption).toBeVisible()
    await matchingOption.click()
  }

  async saveAndContinue() {
    await this.page
      .getByRole('button', {
        name: 'Save and continue',
      })
      .click()
  }
}
