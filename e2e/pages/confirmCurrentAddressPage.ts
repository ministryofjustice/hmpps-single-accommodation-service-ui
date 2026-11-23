import { Page } from '@playwright/test'
import { expectHeadingToBeDisplayed } from '../utils/expectHeadingToBeDisplayed'

export default class ConfirmCurrentAddressPage {
  constructor(private readonly page: Page) {}

  async expectPageToBeDisplayed() {
    await expectHeadingToBeDisplayed(this.page, {
      name: /Confirm that .* has moved into this address/,
      level: 1,
    })
  }

  async confirmCurrentAddress() {
    await this.page.getByRole('button', { name: 'Confirm current address' }).click()
  }
}
