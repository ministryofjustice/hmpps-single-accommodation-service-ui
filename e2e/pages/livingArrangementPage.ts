import { expect, Page } from '@playwright/test'

export class LivingArrangementPage {
  constructor(private readonly page: Page) {}

  async expectPage() {
    await expect(
      this.page.getByRole('heading', {
        name: /Which best describes the living arrangement/,
        level: 1,
      }),
    ).toBeVisible()
  }

  async selectLivingArrangement(option: string) {
    await this.page.getByLabel(option).check()
  }

  async continue() {
    await this.page.getByRole('button', { name: 'Continue' }).click()
  }
}
