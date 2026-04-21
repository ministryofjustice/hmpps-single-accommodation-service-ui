import { expect, Page } from '@playwright/test'
import { DutyToReferDto } from '@sas/api'
import PageWithCaseDetails from './pageWithCaseDetails'
import { formatDutyToReferStatus, outcomeSupportText } from '../../../server/utils/dutyToRefer'
import { formatDateAndDaysAgo } from '../../../server/utils/dates'

export default class DutyToReferDetailsPage extends PageWithCaseDetails {
  constructor(page: Page) {
    super(page)

    this.header = page.locator('h1', { hasText: 'Duty to Refer (DTR)' })
  }

  async shouldShowSubmissionDetails(dutyToRefer: DutyToReferDto) {
    await expect(this.page.getByRole('heading', { name: 'Submission details', exact: true })).toBeVisible()

    if (dutyToRefer.status === 'NOT_STARTED' || dutyToRefer.status === 'SUBMITTED') {
      await this.shouldShowSummaryItem('Status', formatDutyToReferStatus(dutyToRefer.status))
    }
    if (dutyToRefer.status !== 'NOT_STARTED' && dutyToRefer.submission) {
      await this.shouldShowSummaryItem('Date submitted', formatDateAndDaysAgo(dutyToRefer.submission.submissionDate))
      await this.shouldShowSummaryItem('Local authority', dutyToRefer.submission.localAuthority.localAuthorityAreaName)
      await this.shouldShowSummaryItem('Reference', dutyToRefer.submission.referenceNumber)
    }
  }

  async shouldShowEmptyOutcomeDetails() {
    await expect(this.page.getByRole('heading', { name: 'Outcome details' })).toBeVisible()
    await expect(this.page.getByText('No details about the outcome have been added.')).toBeVisible()
  }

  async shouldShowOutcomeDetails(dutyToRefer: DutyToReferDto) {
    await expect(this.page.getByRole('heading', { name: 'Outcome details', exact: true })).toBeVisible()

    const statusText = `${formatDutyToReferStatus(dutyToRefer.status)} ${outcomeSupportText(dutyToRefer)}`
    await this.shouldShowSummaryItem('Status', statusText)
  }
}
