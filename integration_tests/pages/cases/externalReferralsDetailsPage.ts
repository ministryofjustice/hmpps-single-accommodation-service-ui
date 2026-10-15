import { expect, Page } from '@playwright/test'
import { CaseDto as Case, ExternalReferralDto } from '@sas/api'
import AbstractPage from '../abstractPage'
import { formatDateAndDaysAgo } from '../../../server/utils/dates'
import { externalReferralStatusTag } from '../../../server/utils/externalReferrals'
import paths from '../../../server/paths/ui'
import { verifyPost } from '../../mockApis/wiremock'
import apiPaths from '../../../server/paths/api'

export default class ExternalReferralsDetailsPage extends AbstractPage {
  constructor(
    page: Page,
    readonly referral: ExternalReferralDto,
  ) {
    super(page)
    this.header = page.locator('h1', { hasText: referral.submission.organisationName })
  }

  static async visit(page: Page, caseData: Case, referral: ExternalReferralDto): Promise<ExternalReferralsDetailsPage> {
    await page.goto(paths.externalReferrals.show({ crn: caseData.crn, id: referral.submission.id }))
    return ExternalReferralsDetailsPage.verifyOnPage(page, referral)
  }

  async shouldShowSubmissionDetails() {
    await expect(this.page.getByRole('heading', { name: 'Referral details', exact: true })).toBeVisible()
    const {
      status,
      submission: { submissionDate, referenceNumber, website },
    } = this.referral

    await this.shouldShowSummaryItem('Status', externalReferralStatusTag(status).text)
    await this.shouldShowSummaryItem('Submitted on', formatDateAndDaysAgo(submissionDate))
    await this.shouldShowSummaryItem('Reference number', referenceNumber)
    await this.shouldShowSummaryItem('Website', website)
  }

  async checkNoteApiCalled(referral: ExternalReferralDto, note: string) {
    const {
      crn,
      submission: { id },
    } = referral

    const requestBody = await verifyPost(apiPaths.cases.externalReferrals.notes({ crn, id }))

    expect(requestBody).toEqual({ note })
  }
}
