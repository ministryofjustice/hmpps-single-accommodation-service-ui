import { expect, Locator, Page } from '@playwright/test'
import { Case } from '@sas/api'
import AbstractPage from '../abstractPage'

export default class CasesListPage extends AbstractPage {
  readonly header: Locator

  readonly casesRows: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Cases' })

    this.casesRows = page.getByRole('table', { name: 'List of cases' }).getByRole('row')
  }

  static async verifyOnPage(page: Page): Promise<CasesListPage> {
    const casesListPage = new CasesListPage(page)
    await expect(casesListPage.header).toBeVisible()
    return casesListPage
  }

  async shouldShowCases(cases: Case[]) {
    const people = cases.length === 1 ? 'person' : 'people'
    await expect(this.page.getByRole('table').getByRole('caption')).toHaveText(
      `${cases.length} ${people} assigned to you`,
    )

    await this.shouldShowTableHeaders(['Person', 'Current accommodation'])

    for await (const person of cases) {
      const row = this.page.getByRole('row', { name: person.name })
      await expect(row).toContainText(person.crn)
    }
  }
}
