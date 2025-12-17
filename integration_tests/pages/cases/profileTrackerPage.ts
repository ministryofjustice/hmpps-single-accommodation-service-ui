import { expect, Locator, Page } from '@playwright/test'
import { CaseDto as Case, AccommodationReferralDto as Referral } from '@sas/api'
import AbstractPage from '../abstractPage'
import { formatDate, formatRiskLevel, formatStatus } from '../../../server/utils/format'

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

  async shouldShowReferralHistory(referrals: Referral[]) {
    const card = this.page.locator('.govuk-summary-card').filter({
      has: this.page.getByRole('heading', { name: 'Referral history' }),
    })
    const table = card.locator('table.govuk-table')
    for await (const referral of referrals) {
      const i = referrals.indexOf(referral)
      const row = table.locator('tbody tr').nth(i)

      await expect(row).toContainText(referral.type)
      await expect(row).toContainText(formatStatus(referral.status))
      await expect(row).toContainText(formatDate(referral.date))
      await expect(row).toContainText('View')
    }
  }
}
