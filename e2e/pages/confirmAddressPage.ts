import { expect, Page } from '@playwright/test'

export class ConfirmAddressPage {
  constructor(private readonly page: Page) {}

  async expectPage() {
    await expect(
      this.page.getByRole('heading', {
        name: /Do you want to confirm this as the next address/,
        level: 1,
      }),
    ).toBeVisible()
  }

  async confirmAddress() {
    await this.page.getByLabel('Yes').check()
  }

  async doNotConfirmAddress() {
    await this.page.getByLabel('Not yet').check()
  }

  async continue() {
    await this.page
      .getByRole('button', { name: 'Continue' })
      .click()
  }
}
