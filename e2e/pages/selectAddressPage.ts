import { Page } from '@playwright/test'
import { expectHeadingToBeDisplayed } from '../utils/expectHeadingToBeDisplayed'

export default class SelectAddressPage {
  constructor(private readonly page: Page) {}

  async expectPageToBeDisplayed() {
    await expectHeadingToBeDisplayed(this.page, {
      name: 'Confirm address',
      level: 1,
    })
  }

  async continue() {
    await this.page.getByRole('button', { name: 'Continue' }).click()
  }
}
