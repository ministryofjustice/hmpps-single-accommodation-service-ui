import { Page } from '@playwright/test'
import { CaseDto as Case, OtherAccommodationReferralDto } from '@sas/api'
import AbstractPage from '../abstractPage'
import { displayName } from '../../../server/utils/cases'
import { formatDateAndAge } from '../../../server/utils/dates'
import paths from '../../../server/paths/ui'

export default class OtherReferralsSubmissionPage extends AbstractPage {
  constructor(page: Page, expectedHeader: string) {
    super(page)
    this.header = page.locator('h1', { hasText: expectedHeader })
  }

  static async visit(page: Page, caseData: Case): Promise<OtherReferralsSubmissionPage> {
    await page.goto(paths.otherReferrals.submission({ crn: caseData.crn }))
    return OtherReferralsSubmissionPage.verifyOnPage(page, 'Add other accommodation referral details')
  }

  async shouldShowCaseSummary(caseData: Case) {
    await this.shouldShowSummaryItem('Name', displayName(caseData))
    await this.shouldShowSummaryItem('Date of birth', formatDateAndAge(caseData.dateOfBirth))
    await this.shouldShowSummaryItem('CRN', caseData.crn)
    if (caseData.prisonNumber) {
      await this.shouldShowSummaryItem('Prison number', caseData.prisonNumber)
    }
  }

  async completeSubmissionForm(referral: OtherAccommodationReferralDto) {
    const { submission: { submissionDate, referenceNumber, submissionNote, organisationName, website } = {} } = referral

    await this.completeInputByLabel('Organisation name', organisationName)
    await this.completeDateInputByLabel('Submission date', submissionDate)
    await this.completeInputByLabel('Reference number (optional)', referenceNumber)
    await this.completeInputByLabel('Website (optional)', website)
    // TODO: Email and phone
    await this.completeInputByLabel('Notes (optional)', submissionNote)
  }
}
