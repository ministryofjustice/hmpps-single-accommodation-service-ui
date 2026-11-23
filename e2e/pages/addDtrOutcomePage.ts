import { expect } from '@playwright/test'
import BasePage from './basePage'

export type DtrOutcome =
  | 'Yes, it was accepted on prevention and relief duty'
  | 'Yes, it was accepted on a priority need'
  | 'No, it was rejected as there is no local connection'
  | 'No, it was rejected as they are considered intentionally homeless'
  | 'No, it was rejected for another reason'

export class AddDtrOutcomePage extends BasePage {
  async expectPageToBeDisplayed() {
    await this.expectHeadingToBeDisplayed({
      name: 'Add Duty to Refer (DTR) outcome',
      level: 1,
    })

    await expect(
      this.page.getByRole('group', {
        name: 'Did the local authority agree to support this request for housing?',
      }),
    ).toBeVisible()
  }

  async selectOutcome(outcome: DtrOutcome) {
    await this.page
      .getByRole('radio', {
        name: outcome,
      })
      .check()
  }

  async saveAndContinue() {
    await this.page
      .getByRole('button', {
        name: 'Save and continue',
      })
      .click()
  }
}
