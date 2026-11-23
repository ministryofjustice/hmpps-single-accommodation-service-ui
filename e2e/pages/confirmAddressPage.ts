import { Page } from '@playwright/test'
import { expectHeadingToBeDisplayed } from '../utils/expectHeadingToBeDisplayed'

export default class ConfirmAddressPage {
  constructor(private readonly page: Page) {}

  async expectPageToBeDisplayed() {
    await expectHeadingToBeDisplayed(this.page, {
      name: /Do you want to confirm this as the next address/,
      level: 1,
    })
  }

  async confirmAddress() {
    await this.page.getByLabel('Yes').check()
  }

  async doNotConfirmAddress() {
    await this.page.getByLabel('Not yet').check()
  }

  async continue() {
    await this.page.getByRole('button', { name: 'Continue' }).click()
  }
}
