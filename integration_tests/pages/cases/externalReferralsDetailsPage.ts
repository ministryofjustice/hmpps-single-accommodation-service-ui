import { expect, Page } from '@playwright/test'
import { ExternalReferralDto } from '@sas/api'
import AbstractPage from '../abstractPage'
import { formatDateAndDaysAgo } from '../../../server/utils/dates'
import { serviceStatusTag } from '../../../server/utils/statusTag'

export default class ExternalReferralsDetailsPage extends AbstractPage {
  constructor(
    page: Page,
    readonly referral: ExternalReferralDto,
  ) {
    super(page)
    this.header = page.locator('h1', { hasText: referral.submission.organisationName })
  }

  async shouldShowSubmissionDetails() {
    await expect(this.page.getByRole('heading', { name: 'Referral details', exact: true })).toBeVisible()
    const {
      status,
      submission: { submissionDate, referenceNumber, website },
    } = this.referral

    await this.shouldShowSummaryItem('Status', serviceStatusTag(status).text)
    await this.shouldShowSummaryItem('Submitted on', formatDateAndDaysAgo(submissionDate))
    await this.shouldShowSummaryItem('Reference number', referenceNumber)
    await this.shouldShowSummaryItem('Website', website)
  }
}
