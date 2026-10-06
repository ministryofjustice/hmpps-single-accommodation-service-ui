import { expect, Page } from '@playwright/test'
import { CaseDto as Case, ExternalReferralCommand, ExternalReferralDto } from '@sas/api'
import AbstractPage from '../abstractPage'
import { displayName } from '../../../server/utils/cases'
import { formatDateAndAge } from '../../../server/utils/dates'
import paths from '../../../server/paths/ui'
import { verifyPost, verifyPut } from '../../mockApis/wiremock'
import apiPaths from '../../../server/paths/api'

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
      },
    } = referral
    const requestBody =
      method === 'submit'
        ? await verifyPost(apiPaths.cases.externalReferrals.submit({ crn }))
        : await verifyPut(apiPaths.cases.externalReferrals.update({ crn, id }))

    const expectedBody: ExternalReferralCommand = {
      organisationName,
      submissionDate,
      referenceNumber,
      status,
      website,
      email,
      phoneNumber,
      submissionNote: submissionNote || '',
    }

    expect(requestBody).toEqual(expectedBody)
  }
}
