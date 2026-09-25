import { expect, Page } from '@playwright/test'
import { OtherAccommodationReferralDto } from '@sas/api'
import AbstractPage from '../abstractPage'
import { formatDutyToReferStatus } from '../../../server/utils/dutyToRefer'
import { formatDateAndDaysAgo } from '../../../server/utils/dates'

export default class OtherReferralsDetailsPage extends AbstractPage {
  constructor(
    page: Page,
    readonly referral: OtherAccommodationReferralDto,
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

    if (status === 'SUBMITTED') {
      await this.shouldShowSummaryItem('Status', formatDutyToReferStatus(status))
    }
    await this.shouldShowSummaryItem('Submitted on', formatDateAndDaysAgo(submissionDate))
    await this.shouldShowSummaryItem('Reference number', referenceNumber)
    await this.shouldShowSummaryItem('Website', website)
  }
}
