import { expect, Page } from '@playwright/test'
import { DutyToReferDto, SubmitDutyToRefer } from '@sas/ui'
import { CaseDto as Case } from '@sas/api'
import AbstractPage from '../abstractPage'
import paths from '../../../server/paths/ui'
import { verifyPost } from '../../mockApis/wiremock'
import apiPaths from '../../../server/paths/api'

export default class DutyToReferPage extends AbstractPage {
  constructor(page: Page, submittedTo: string) {
    super(page)
    this.header = page.locator('h1', { hasText: `Submit a duty to refer (DTR) to ${submittedTo}` })
  }

  static async visit(page: Page, caseData: Case): Promise<DutyToReferPage> {
    await page.goto(paths.dutyToRefer.guidance({ crn: caseData.crn }))
    return DutyToReferPage.verifyOnPage(page)
  }

  async shouldShowGuidancePage() {
    await expect(this.page.getByRole('heading', { name: 'Duty to refer guidance' })).toBeVisible()
  }

  async shouldShowSubmissionForm(caseData: Case) {
    await expect(this.page.getByRole('heading', { name: 'Add Duty to Refer (DTR) submission details' })).toBeVisible()
    
    this.shouldShowSummaryItem('Name', caseData.name)
    this.shouldShowSummaryItem('Date of birth', caseData.dateOfBirth)
    this.shouldShowSummaryItem('CRN', caseData.crn)
    this.shouldShowSummaryItem('Prison number', caseData.prisonNumber)
  }

  async completeSubmissionForm(dutyToRefer: DutyToReferDto, differentLocalAuthority: boolean = false) {
    await this.completeDateInputByLabel('When was the DTR submitted?', dutyToRefer.submission.submissionDate)
    if (differentLocalAuthority) {
      await this.selectRadioByLabel('No, a different local authority')
      await this.selectOptionByLabel('Enter a local authority', dutyToRefer.submission.localAuthorityName)
    } else {
      await this.selectRadioByLabel('Yes')
    }
    if (dutyToRefer.submission.referenceNumber) {
      await this.completeInputByLabel('Reference number', dutyToRefer.submission.referenceNumber)
    }
  }

  async shouldShowOutcomePage() {
    await expect(this.page.getByRole('heading', { name: 'Add Duty to Refer (DTR) outcome details' })).toBeVisible()
  }

  async completeOutcomeForm(dutyToRefer: DutyToReferDto) {
    await this.selectRadioByLabel(dutyToRefer.submission.outcomeStatus)
  }

  async checkApiCalled(crn: string, dutyToRefer: DutyToReferDto) {
    const requestBody = await verifyPost(apiPaths.cases.proposedAddresses.submit({ crn }))

    const expectedBody = dutyToRefer.submission

    expect(requestBody).toEqual(expectedBody)
  }
}
