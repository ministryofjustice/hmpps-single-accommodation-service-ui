import { Page } from '@playwright/test'
import { expectHeadingToBeDisplayed } from '../utils/expectHeadingToBeDisplayed'

export default class LivingArrangementPage {
  constructor(private readonly page: Page) {}

  async expectPageToBeDisplayed() {
    await expectHeadingToBeDisplayed(this.page, {
      name: /Which best describes the living arrangement/,
      level: 1,
    })
  }

  async selectLivingArrangement(option: string) {
    await this.page.getByLabel(option).check()
  }

  async continue() {
    await this.page.getByRole('button', { name: 'Continue' }).click()
  }
}
