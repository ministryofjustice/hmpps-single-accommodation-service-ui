import { expect, Page } from '@playwright/test'
import { CaseDto as Case } from '@sas/api'
import ListPage from './listPage'
import { displayName } from '../../../server/utils/cases'

export default class SearchPage extends ListPage {
  constructor(page: Page) {
    super(page)
    this.header = page.locator('label', { hasText: 'Find a person' })
  }

  async shouldShowSearchResults(caseData: Case, headers: string[], assignedTo = false) {
    await this.shouldShowCases([caseData], headers, assignedTo)
  }

  async shouldShowRecentSearches(cases: Case[]) {
    await expect(this.page.getByRole('heading', { name: 'Recent searches' })).toBeVisible()
    const items = this.page.getByRole('list', { name: 'Recent searches' }).getByRole('listitem')
    await expect(items).toHaveCount(cases.length)
    for await (const [index, caseData] of cases.entries()) {
      const name = displayName(caseData, { caseList: true, onlyFirstLast: true, laoFlag: '' })
      await expect(items.nth(index)).toHaveText(`${caseData.crn} - ${name}`)
    }
  }

  async shouldNotShowRecentSearches() {
    await expect(this.page.getByRole('heading', { name: 'Recent searches' })).not.toBeVisible()
  }

  async clickRecentSearch(caseData: Case) {
    await this.page.getByRole('list', { name: 'Recent searches' }).getByRole('link', { name: caseData.crn }).click()
  }
}
