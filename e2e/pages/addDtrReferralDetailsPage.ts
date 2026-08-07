import { expect, Page } from '@playwright/test'

type DateInput = {
  day: string
  month: string
  year: string
}

export class AddDtrReferralDetailsPage {
  constructor(private readonly page: Page) {}

  async expectPageToBeDisplayed() {
    await expect(
      this.page.getByRole('heading', {
        name: 'Add Duty to Refer (DTR) referral details',
        level: 1,
      }),
    ).toBeVisible()
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
