import { expect, Page } from '@playwright/test'

export class CheckAnswersPage {
  constructor(private readonly page: Page) {}

  async expectPage() {
    await expect(
      this.page.getByRole('heading', {
        name: 'Check your answers before adding the address',
        level: 1,
      }),
    ).toBeVisible()
  }

  async save() {
    await this.page
      .getByRole('button', { name: 'Save' })
      .click()
  }
}
