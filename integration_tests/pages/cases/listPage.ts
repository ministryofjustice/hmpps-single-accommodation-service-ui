import { expect, Locator, Page } from '@playwright/test'
import { CaseDto as Case } from '@sas/api'
import AbstractPage from '../abstractPage'
import { formatDate } from '../../../server/utils/dates'
import { riskLevelStatusTag } from '../../../server/utils/riskLevel'

export default class CasesListPage extends AbstractPage {
  readonly casesRows: Locator

  constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Cases' })

    this.casesRows = page.getByRole('table', { name: 'List of cases' }).getByRole('row')
  }

  async shouldShowTableCaption(caption: string, filterApplied = false) {
    await expect(this.page.getByRole('heading', { name: caption })).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'Clear search' })).toBeVisible({ visible: filterApplied })
  }

  async shouldShowCases(cases: Case[]) {
    await this.shouldShowTableHeaders(['Person', 'Current accommodation'])

    for await (const person of cases) {
      const row = this.page.getByRole('row', { name: person.name })
      await expect(row).toContainText(riskLevelStatusTag(person.riskLevel).text)
      await expect(row).toContainText(person.tier as string)
      await expect(row).toContainText(formatDate(person.dateOfBirth as string))
      await expect(row).toContainText(person.crn as string)
      await expect(row).toContainText(person.prisonNumber as string)
    }
  }

  async applyFilters({ searchTerm, assignedTo, riskLevel }: Record<string, string>) {
    await this.completeInputByLabel('Search by name, CRN or prison number', searchTerm)
    await this.selectOptionByLabel('Assigned to', assignedTo)
    await this.selectOptionByLabel('RoSH', riskLevel)
    await this.clickButton('Apply filters')
  }

  async verifyFilters({ searchTerm, assignedTo, riskLevel }: Record<string, string>) {
    await this.verifyTextInput('Search by name, CRN or prison number', searchTerm)
    await this.verifySelectInput('Assigned to', assignedTo)
    await this.verifySelectInput('RoSH', riskLevel)
  }
}
