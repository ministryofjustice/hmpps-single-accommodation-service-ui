import { expect, Page } from '@playwright/test'
import { DutyToReferDto, DtrCommand, CaseDto as Case } from '@sas/api'
import AbstractPage from '../abstractPage'
import { verifyPost, verifyPut } from '../../mockApis/wiremock'
import apiPaths from '../../../server/paths/api'

export default class DutyToReferPage extends AbstractPage {
  constructor(page: Page, expectedHeader: string) {
    super(page)
    this.header = page.locator('h1', { hasText: expectedHeader })
  }

  async shouldShowGuidancePage() {
    await expect(this.page.getByRole('heading', { name: 'Submit a duty to refer (DTR)' })).toBeVisible()
  }

  async shouldShowSubmissionForm(caseData: Case) {
    await expect(this.page.getByRole('heading', { name: 'Add Duty to Refer (DTR) submission details' })).toBeVisible()

    this.shouldShowSummaryItem('Name', caseData.name)
    this.shouldShowSummaryItem('Date of birth', caseData.dateOfBirth)
    this.shouldShowSummaryItem('CRN', caseData.crn)
    this.shouldShowSummaryItem('Prison number', caseData.prisonNumber)
  }

  async completeSubmissionForm(dutyToRefer: DutyToReferDto, localAuthorityAreaName: string) {
    await this.completeDateInputByLabel('When was the DTR submitted?', dutyToRefer.submission.submissionDate)
    await this.selectAutocompleteByLabel('What local authority was the DTR submitted to?', localAuthorityAreaName)
    if (dutyToRefer.submission.referenceNumber) {
      await this.completeInputByLabel('Reference number', dutyToRefer.submission.referenceNumber)
    }
  }

  async shouldShowOutcomePage() {
    await expect(this.page.getByRole('heading', { name: 'Add Duty to Refer (DTR) outcome details' })).toBeVisible()
  }

  async completeOutcomeForm(dutyToRefer: DutyToReferDto) {
    const outcome = dutyToRefer.status === 'ACCEPTED' ? 'Yes' : 'No'
    await this.selectRadioByLabel(outcome)
  }

  async checkApiCalled(crn: string, dutyToRefer: DtrCommand, method: 'submit' | 'update' = 'submit', id: string = '') {
    const path =
      method === 'submit' ? apiPaths.cases.dutyToRefer.submit({ crn }) : apiPaths.cases.dutyToRefer.update({ crn, id })

    const requestBody = method === 'submit' ? await verifyPost(path) : await verifyPut(path)

    expect(requestBody).toEqual(dutyToRefer)
  }
}
