import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CasesListPage extends AbstractPage {
  readonly header: Locator

  readonly casesList: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Cases' })

    this.casesList = page.locator('main ul')
  }

  static async verifyOnPage(page: Page): Promise<CasesListPage> {
    const casesListPage = new CasesListPage(page)
    await expect(casesListPage.header).toBeVisible()
    return casesListPage
  }
}
