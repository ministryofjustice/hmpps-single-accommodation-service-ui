import { expect, Locator, Page } from '@playwright/test'
import { CaseDto as Case } from '@sas/api'
import AbstractPage from '../abstractPage'
import { formatDate } from '../../../server/utils/dates'
import { riskLevelStatusTag } from '../../../server/utils/riskLevel'
import { accommodationType, caseStatusTag } from '../../../server/utils/cases'

export default class CasesListPage extends AbstractPage {
  readonly casesRows: Locator

  constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Cases' })

    this.casesRows = page.getByRole('table', { name: 'List of cases' }).getByRole('row')
  }

  async shouldShowResultsSummary(caption: string) {
    await expect(this.page.getByRole('heading', { name: caption })).toBeVisible()
  }

  async shouldShowCases(cases: Case[], headers: string[]) {
    await this.shouldShowTableHeaders(headers)

    for await (const person of cases) {
      const row = this.page.getByRole('row', { name: person.name })

      if (headers.includes('Person')) {
        await expect(row).toContainText(riskLevelStatusTag(person.riskLevel).text)
        await expect(row).toContainText(person.tierScore as string)
        await expect(row).toContainText(formatDate(person.dateOfBirth as string))
        await expect(row).toContainText(person.crn as string)
        await expect(row).toContainText(person.prisonNumber as string)
      }

      if (headers.includes('Current accommodation') && person.currentAccommodation) {
        await expect(row).toContainText(accommodationType(person.currentAccommodation, 'current'))
      }

      if (headers.includes('Next accommodation') && person.nextAccommodation) {
        await expect(row).toContainText(accommodationType(person.nextAccommodation, 'next'))
      }

      if (headers.includes('Status') && person.status) {
        await this.shouldShowStatusTag(caseStatusTag(person), row)
      }

      if (headers.includes('Actions')) {
        for await (const action of person.actions) {
          await expect(row).toContainText(action)
        }
      }
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

  async shouldShowFilterTags(filters: Record<string, string>) {
    for await (const [key, value] of Object.entries(filters)) {
      if (value) {
        const filterText = `${key}: ${value}`
        await expect(this.page.getByRole('link', { name: filterText })).toBeVisible()
      }
    }
  }
}
