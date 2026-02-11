import { expect, Locator, Page } from '@playwright/test'
import { CaseDto as Case } from '@sas/api'
import AbstractPage from '../abstractPage'
import { formatDate, formatRiskLevel } from '../../../server/utils/format'

export default class CasesListPage extends AbstractPage {
  readonly casesRows: Locator

  constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Cases' })

    this.casesRows = page.getByRole('table', { name: 'List of cases' }).getByRole('row')
  }

  async shouldShowCases(caption: string, cases: Case[]) {
    await this.shouldShowTableCaption(caption)
    await this.shouldShowTableHeaders(['Person', 'Current accommodation'])

    for await (const person of cases) {
      const row = this.page.getByRole('row', { name: person.name })
      await expect(row).toContainText(formatRiskLevel(person.riskLevel as Case['riskLevel']))
      await expect(row).toContainText(person.tier as string)
      await expect(row).toContainText(formatDate(person.dateOfBirth as string))
      await expect(row).toContainText(person.crn as string)
      await expect(row).toContainText(person.prisonNumber as string)
    }
  }

  async applyFilters({ searchTerm, assignedTo, riskLevel }: Record<string, string>) {
    await this.page.getByLabel('Search by name, CRN or prison number').fill(searchTerm)
    await this.page.getByLabel('Assigned to').selectOption(assignedTo)
    await this.page.getByLabel('RoSH').selectOption(riskLevel)
    await this.page.getByRole('button', { name: 'Apply filters' }).click()
  }
}
