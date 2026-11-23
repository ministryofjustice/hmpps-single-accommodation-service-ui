import { Page } from '@playwright/test'
import { expectHeadingToBeDisplayed } from '../utils/expectHeadingToBeDisplayed'

export default class CheckAnswersPage {
  constructor(private readonly page: Page) {}

  async expectPageToBeDisplayed() {
    await expectHeadingToBeDisplayed(this.page, {
      name: 'Check your answers before adding the address',
      level: 1,
    })
  }

  async save() {
    await this.page.getByRole('button', { name: 'Save' }).click()
  }
}
