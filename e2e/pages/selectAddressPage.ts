import { expect, Page } from '@playwright/test'

export class SelectAddressPage {
  constructor(private readonly page: Page) {}

  async expectPage() {
    await expect(
      this.page.getByRole('heading', {
        name: 'Confirm address',
        level: 1,
      }),
    ).toBeVisible()
  }

  async continue() {
    await this.page
      .getByRole('button', { name: 'Continue' })
      .click()
  }
}
