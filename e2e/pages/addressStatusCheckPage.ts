import { Page } from '@playwright/test'
import { expectHeadingToBeDisplayed } from '../utils/expectHeadingToBeDisplayed'

export default class AddressStatusCheckPage {
  constructor(private readonly page: Page) {}

  async expectPageToBeDisplayed() {
    await expectHeadingToBeDisplayed(this.page, {
      name: 'What is the status of the address checks?',
      level: 1,
    })
  }

  async selectPassed(reason: string) {
    await this.page.getByLabel('Passed').check()
    await this.page.getByLabel('Why is it suitable?').fill(reason)
  }

  async selectFailed(reason: string) {
    await this.page.getByLabel('Failed').check()
    await this.page.getByLabel('Why is it not suitable?').fill(reason)
  }

  async selectNotChecked() {
    await this.page.getByLabel('Not checked').check()
  }

  async continue() {
    await this.page.getByRole('button', { name: 'Cnue' }).click()
  }
}
