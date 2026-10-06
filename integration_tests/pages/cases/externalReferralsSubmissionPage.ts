import { expect, Page } from '@playwright/test'
import { CaseDto as Case, ExternalReferralCommand, ExternalReferralDto, ExternalReferralWithdrawalDto } from '@sas/api'
import { faker } from '@faker-js/faker'
import AbstractPage from '../abstractPage'
import { displayName } from '../../../server/utils/cases'
import { formatDateAndAge, formatDateAndDaysAgo } from '../../../server/utils/dates'
import paths from '../../../server/paths/ui'
import { verifyPost, verifyPut } from '../../mockApis/wiremock'
import apiPaths from '../../../server/paths/api'
import { withdrawalReasonLabels } from '../../../server/utils/externalReferrals'

export default class ExternalReferralsSubmissionPage extends AbstractPage {
  constructor(page: Page, expectedHeader: string) {
    super(page)
    this.header = page.locator('h1', { hasText: expectedHeader })
  }

  static async visit(page: Page, caseData: Case): Promise<ExternalReferralsSubmissionPage> {
    await page.goto(paths.externalReferrals.submission({ crn: caseData.crn }))
    return ExternalReferralsSubmissionPage.verifyOnPage(page, 'Add external referral details')
  }

  async shouldShowCaseSummary(caseData: Case) {
    await this.shouldShowSummaryItem('Name', displayName(caseData))
    await this.shouldShowSummaryItem('Date of birth', formatDateAndAge(caseData.dateOfBirth))
    await this.shouldShowSummaryItem('CRN', caseData.crn)
    if (caseData.prisonNumber) {
      await this.shouldShowSummaryItem('Prison number', caseData.prisonNumber)
    }
  }

  async shouldShowReferralSummary(referral: ExternalReferralDto, caseData: Case) {
    await this.shouldShowCaseSummary(caseData)
    await this.shouldShowSummaryItem('Organisation', referral.submission.organisationName)
    await this.shouldShowSummaryItem('Date submitted', formatDateAndDaysAgo(referral.submission.submissionDate))
  }

  async completeSubmissionForm(referral: ExternalReferralDto) {
    const {
      submission: {
        submissionDate,
        referenceNumber,
        submissionNote,
        organisationName,
        website,
        email,
        phoneNumber,
      } = {},
    } = referral

    await this.completeInputByLabel('Organisation name', organisationName)
    await this.completeDateInputByLabel('Submission date', submissionDate)
    await this.completeInputByLabel('Reference number (optional)', referenceNumber)
    await this.completeInputByLabel('Website (optional)', website)
    await this.completeInputByLabel('Email (optional)', email)
    await this.completeInputByLabel('Phone number (optional)', phoneNumber)
    await this.completeInputByLabel('Notes (optional)', submissionNote)
  }

  async completeOutcomeForm(referral: ExternalReferralDto, statusLabel = 'Accepted'): Promise<ExternalReferralDto> {
    const outcomeNote: string = faker.lorem.paragraph()
    await this.selectRadioByLabel(statusLabel)
    await this.completeInputByLabel('Notes (optional)', outcomeNote)
    return {
      ...referral,
      status: statusLabel === 'Accepted' ? 'ACCEPTED' : 'REJECTED',
      submission: { ...referral.submission, outcomeNote },
    }
  }

  async completeWithdrawalForm(referral: ExternalReferralDto, reasonLabel = 'Placement complete') {
    const note: string = faker.lorem.paragraph()
    await this.selectRadioByLabel(reasonLabel)
    await this.completeInputByLabel('Notes (optional)', note)
    return {
      ...referral,
      withdrawalReason: Object.keys(withdrawalReasonLabels).find(
        key => withdrawalReasonLabels[key] === reasonLabel,
      ) as ExternalReferralWithdrawalDto['withdrawalReason'],
      withdrawalNote: note,
    }
  }

  async checkApiCalled(referral: ExternalReferralDto, method: 'submit' | 'update' = 'submit') {
    const {
      crn,
      status,
      submission: {
        id,
        organisationName,
        submissionDate,
        referenceNumber,
        website,
        email,
        phoneNumber,
        submissionNote,
        outcomeNote,
      },
    } = referral
    const requestBody =
      method === 'submit'
        ? await verifyPost(apiPaths.cases.externalReferrals.submit({ crn }))
        : await verifyPut(apiPaths.cases.externalReferrals.update({ crn, id }))

    // Get rid of empty strings in the request body
    Object.keys(requestBody).forEach(key => {
      requestBody[key] = requestBody[key] || undefined
    })

    const expectedBody: ExternalReferralCommand = {
      organisationName,
      submissionDate,
      referenceNumber,
      status,
      website,
      email,
      phoneNumber,
      submissionNote,
      outcomeNote,
    }

    expect(requestBody).toEqual(expectedBody)
  }

  async checkWithdrawalApiCalled(referral: ExternalReferralDto) {
    const {
      crn,
      withdrawalReason,
      withdrawalNote,
      submission: { id },
    } = referral
    const postBody = await verifyPost(apiPaths.cases.externalReferrals.withdrawal({ crn, id }))

    expect(postBody).toEqual({
      withdrawalReason,
      withdrawalNote,
    })
  }
}
