import { expect, Locator, Page } from '@playwright/test'
import { CaseDto as Case } from '@sas/api'
import AbstractPage from '../abstractPage'
import { formatDate, formatRiskLevel } from '../../../server/utils/format'

export default class ProfileTrackerPage extends AbstractPage {
  readonly header: Locator

  private constructor(page: Page, caseData: Case) {
    super(page)
    this.header = page.locator('h1', { hasText: caseData.name })
  }

  static async verifyOnPage(page: Page, caseData: Case): Promise<ProfileTrackerPage> {
    const profileTrackerPage = new ProfileTrackerPage(page, caseData)
    await expect(profileTrackerPage.header).toBeVisible()
    return profileTrackerPage
  }

  async shouldShowCaseDetails(caseData: Case) {
    const details = [
      { label: 'RoSH', value: formatRiskLevel(caseData.riskLevel as Case['riskLevel']) },
      { label: 'Tier', value: caseData.tier },
      { label: 'CRN', value: caseData.crn },
      { label: 'Prison number', value: caseData.prisonNumber },
      { label: 'PNC reference', value: caseData.pncReference },
      { label: 'Date of birth', value: formatDate(caseData.dateOfBirth) },
      { label: 'Assigned to', value: caseData.assignedTo?.name },
    ]

    for await (const detail of details) {
      const dd = this.page.locator(`dt:has-text("${detail.label}") + dd`)
      await expect(dd).toContainText(detail.value ?? '')
    }
  }
}
