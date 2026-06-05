import { expect, Page } from '@playwright/test'
import { DutyToReferDto, CaseDto as Case, DtrCommand } from '@sas/api'
import AbstractPage from '../abstractPage'
import { verifyPost, verifyPut } from '../../mockApis/wiremock'
import apiPaths from '../../../server/paths/api'
import { formatDateAndAge, formatDateAndDaysAgo } from '../../../server/utils/dates'
import { outcomeReasonLabel, withdrawalReasonItems } from '../../../server/utils/dutyToRefer'

export default class DutyToReferPage extends AbstractPage {
  constructor(page: Page, expectedHeader: string) {
    super(page)
    this.header = page.locator('h1', { hasText: expectedHeader })
  }

  async shouldShowCaseSummary(caseData: Case) {
    await this.shouldShowSummaryItem('Name', caseData.name)
    await this.shouldShowSummaryItem('Date of birth', formatDateAndAge(caseData.dateOfBirth))
    await this.shouldShowSummaryItem('CRN', caseData.crn)
    await this.shouldShowSummaryItem('Prison number', caseData.prisonNumber)
  }

  async shouldShowPopulatedSubmissionForm(dutyToRefer: DutyToReferDto) {
    await this.verifyDateInputByLabel('When was the DTR submitted?', dutyToRefer.submission.submissionDate)
    await this.verifySelectInput(
      'What local authority was the DTR submitted to?',
      dutyToRefer.submission.localAuthority.localAuthorityAreaName,
    )
    if (dutyToRefer.submission.referenceNumber) {
      await this.verifyTextInput('Reference number', dutyToRefer.submission.referenceNumber)
    }
  }

  async completeSubmissionForm(dutyToRefer: DutyToReferDto) {
    await this.completeDateInputByLabel('When was the DTR submitted?', dutyToRefer.submission.submissionDate)
    await this.selectAutocompleteByLabel(
      'What local authority was the DTR submitted to?',
      dutyToRefer.submission.localAuthority.localAuthorityAreaName,
    )
    if (dutyToRefer.submission.referenceNumber) {
      await this.completeInputByLabel('Reference number', dutyToRefer.submission.referenceNumber)
    }
  }

  async shouldShowOutcomePage(caseData: Case, dtr: DutyToReferDto) {
    await this.shouldShowCaseSummary(caseData)

    await this.shouldShowSummaryItem('Local authority', dtr.submission.localAuthority.localAuthorityAreaName)
    await this.shouldShowSummaryItem('Date submitted', formatDateAndDaysAgo(dtr.submission.submissionDate))
  }

  async completeOutcomeForm(dutyToRefer: DutyToReferDto) {
    const reason = outcomeReasonLabel[dutyToRefer.submission.outcomeReason]
    await this.selectRadioByLabel(reason)
  }

  async completeWithdrawalForm(dutyToRefer: DutyToReferDto) {
    const reason = dutyToRefer.submission.withdrawalReason
      ? withdrawalReasonItems().find(item => item.value === dutyToRefer.submission.withdrawalReason)?.text
      : 'Other'

    await this.selectRadioByLabel(reason)
    if (dutyToRefer.submission.withdrawalReason === 'OTHER') {
      await this.completeInputByLabel('Please specify', dutyToRefer.submission.withdrawalReasonOther)
    }
  }

  async checkApiCalled(crn: string, dutyToRefer: DutyToReferDto, method: 'submit' | 'update' = 'submit') {
    const { submission } = dutyToRefer
    const requestBody =
      method === 'submit'
        ? await verifyPost(apiPaths.cases.dutyToRefer.submit({ crn }))
        : await verifyPut(apiPaths.cases.dutyToRefer.update({ crn, id: submission.id }))

    const expectedBody: DtrCommand = {
      localAuthorityAreaId: submission.localAuthority.localAuthorityAreaId,
      submissionDate: submission.submissionDate,
      referenceNumber: submission.referenceNumber,
      status: dutyToRefer.status,
    }

    if (submission.outcomeReason != null) {
      expectedBody.outcomeReason = submission.outcomeReason
    }

    if (dutyToRefer.status === 'WITHDRAWN') {
      expectedBody.withdrawalReason = dutyToRefer.submission.withdrawalReason
      expectedBody.withdrawalReasonOther = dutyToRefer.submission.withdrawalReasonOther ?? null
    }

    expect(requestBody).toEqual(expectedBody)
  }
}
