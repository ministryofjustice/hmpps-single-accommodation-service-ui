import { Page } from '@playwright/test'
import { CaseDto as Case } from '@sas/api'
import ListPage from './listPage'

export default class SearchPage extends ListPage {
  constructor(page: Page) {
    super(page)
    this.header = page.locator('label', { hasText: 'Find a person' })
  }

  async shouldShowSearchResults(caseData: Case, headers: string[], assignedTo = false) {
    await this.shouldShowCases([caseData], headers, assignedTo)
  }
}
