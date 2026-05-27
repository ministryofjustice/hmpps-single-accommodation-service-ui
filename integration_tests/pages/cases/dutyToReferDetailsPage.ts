import { expect, Page } from '@playwright/test'
import { DutyToReferDto } from '@sas/api'
import PageWithCaseDetails from './pageWithCaseDetails'
import {
  formatDutyToReferStatus,
  outcomeReasonSummaryLabel,
  outcomeSupportText,
} from '../../../server/utils/dutyToRefer'
import { formatDateAndDaysAgo } from '../../../server/utils/dates'

export default class DutyToReferDetailsPage extends PageWithCaseDetails {
  constructor(page: Page) {
    super(page)

    this.header = page.locator('h1', { hasText: 'Duty to Refer (DTR)' })
  }

  async shouldShowSubmissionDetails(dutyToRefer: DutyToReferDto) {
    await expect(this.page.getByRole('heading', { name: 'Referral details', exact: true })).toBeVisible()

    if (dutyToRefer.status === 'SUBMITTED') {
      await this.shouldShowSummaryItem('Status', formatDutyToReferStatus(dutyToRefer.status))
    }
    await this.shouldShowSummaryItem('Date submitted', formatDateAndDaysAgo(dutyToRefer.submission.submissionDate))
    await this.shouldShowSummaryItem('Local authority', dutyToRefer.submission.localAuthority.localAuthorityAreaName)
    await this.shouldShowSummaryItem('Reference', dutyToRefer.submission.referenceNumber)
  }

  async shouldShowAddOutcomeButton() {
    await expect(this.page.getByRole('button', { name: 'Add outcome' })).toBeVisible()
  }

  async shouldNotShowAddOutcomeButton() {
    await expect(this.page.getByRole('button', { name: 'Add outcome' })).not.toBeVisible()
  }

  async shouldShowOutcomeDetails(dutyToRefer: DutyToReferDto) {
    await expect(this.page.getByRole('heading', { name: 'Outcome details', exact: true })).toBeVisible()

    const statusText = `${formatDutyToReferStatus(dutyToRefer.status)} ${outcomeSupportText(dutyToRefer)}`
    await this.shouldShowSummaryItem('Status', statusText)
    await this.shouldShowSummaryItem('Reason', outcomeReasonSummaryLabel[dutyToRefer.submission.outcomeReason])
  }
}
