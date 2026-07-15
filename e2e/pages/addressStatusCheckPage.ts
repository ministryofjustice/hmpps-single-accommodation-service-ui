import { expect, Page } from '@playwright/test'

export class AddressStatusCheckPage {
  constructor(private readonly page: Page) {}

  async expectPage() {
    await expect(
      this.page.getByRole('heading', {
        name: 'What is the status of the address checks?',
        level: 1,
      }),
    ).toBeVisible()
  }

  async selectPassed() {
    await this.page.getByLabel('Passed').check()
  }

  async selectFailed() {
    await this.page.getByLabel('Failed').check()
  }

  async selectNotChecked() {
    await this.page.getByLabel('Not checked').check()
  }

  async continue() {
    await this.page
      .getByRole('button', { name: 'Continue' })
      .click()
  }
}
