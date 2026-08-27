import { expect, Locator, Page } from '@playwright/test'
import { CaseDto as Case } from '@sas/api'
import AbstractPage from '../abstractPage'
import { formatDate } from '../../../server/utils/dates'
import { riskLevelStatusTag } from '../../../server/utils/riskLevel'
import { displayName } from '../../../server/utils/cases'
import { accommodationType, accommodationStatusCell } from '../../../server/utils/accommodationSummary'

export default class CasesListPage extends AbstractPage {
  readonly casesRows: Locator

  constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Accommodation case list' })

    this.casesRows = page.getByRole('table', { name: 'List of cases' }).getByRole('row')
  }

  async shouldShowResultsSummary(caption: string) {
    await expect(this.page.getByRole('heading', { name: caption })).toBeVisible()
  }

  async shouldShowCases(cases: Case[], headers: string[], assignedTo = false) {
    await this.shouldShowTableHeaders(headers)

    for await (const [index, person] of cases.entries()) {
      const row =
        person.userAccess !== 'LIMITED'
          ? this.page.getByRole('row', { name: displayName(person, { caseList: true, laoFlag: '' }) })
          : this.page.locator('tbody').getByRole('row').nth(index)

      await expect(row).toContainText(person.crn as string)
      await expect(row).toContainText(person.prisonNumber as string)

      if (assignedTo) {
        await expect(row).toContainText('Assigned to')
        await expect(row).toContainText(`${person.assignedTo.forename} ${person.assignedTo.surname}`)
      } else {
        await expect(row).not.toContainText('Assigned to')
      }

      const accommodations = [
        person.accommodationSummaries?.currentAccommodation,
        person.accommodationSummaries?.nextAccommodation,
      ].filter(Boolean)

      if (person.userAccess !== 'LIMITED') {
        await expect(row).toContainText(riskLevelStatusTag(person.riskLevel).text)
        await expect(row).toContainText(person.tierScore as string)
        await expect(row).toContainText(formatDate(person.dateOfBirth as string))

        for await (const accommodation of accommodations) {
          await expect(row).toContainText(accommodationType(accommodation))
        }
      } else {
        await expect(row).not.toContainText('RoSH')
        await expect(row).not.toContainText('Tier')
        await expect(row).not.toContainText('Date of birth')

        for await (const accommodation of accommodations) {
          await expect(row).not.toContainText(accommodationType(accommodation))
        }
      }

      const status = accommodationStatusCell(person)
      if (status) {
        await expect(row).toContainText(status.status.text)
      }
    }
  }

  async applyFilters({ searchTerm, teamName, riskLevel }: Record<string, string>) {
    if (searchTerm) await this.completeInputByLabel('Search by name, CRN or prison number', searchTerm)
    if (teamName) await this.selectOptionByLabel('Assigned to', teamName)
    if (riskLevel) await this.selectOptionByLabel('RoSH', riskLevel)
    await this.clickButton('Apply filters')
  }

  async verifyFilters({ searchTerm, teamCode, riskLevel }: Record<string, string>) {
    await this.verifyTextInput('Search by name, CRN or prison number', searchTerm)
    await this.verifySelectInput('Assigned to', teamCode)
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

  async clickCaseLink(caseData: Case) {
    await this.clickLink(displayName(caseData, { caseList: true, laoFlag: '' }))
  }
}
