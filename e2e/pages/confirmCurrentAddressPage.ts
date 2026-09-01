import { expect, Page } from '@playwright/test'

export default class ConfirmCurrentAddressPage {
  constructor(private readonly page: Page) {}

  async expectPageToBeDisplayed() {
    await expect(
      this.page.getByRole('heading', {
        name: /Confirm that .* has moved into this address/,
        level: 1,
      }),
    ).toBeVisible()
  }

  async confirmCurrentAddress() {
    await this.page.getByRole('button', { name: 'Confirm current address' }).click()
  }
}
