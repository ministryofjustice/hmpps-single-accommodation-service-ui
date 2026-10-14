import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CustomListPage extends AbstractPage {
  readonly casesRows: Locator

  constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Custom list' })

    this.casesRows = page.getByRole('table', { name: 'List of cases' }).getByRole('row')
  }

  async shouldShowResultsSummary(caption: string) {
    await expect(this.page.getByRole('heading', { name: caption })).toBeVisible()
  }
}
