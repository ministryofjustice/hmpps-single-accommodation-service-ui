import { expect, Page } from '@playwright/test'

export default class SelectAddressPage {
  constructor(private readonly page: Page) {}

  async expectPageToBeDisplayed() {
    await expect(
      this.page.getByRole('heading', {
        name: 'Confirm address',
        level: 1,
      }),
    ).toBeVisible()
  }

  async continue() {
    await this.page.getByRole('button', { name: 'Continue' }).click()
  }
}
