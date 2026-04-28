import { test } from '@playwright/test'
import { AuditRecordDto, DutyToReferDto } from '@sas/api'
import casesApi from '../../mockApis/cases'
import proposedAddressesApi from '../../mockApis/proposedAddresses'
import dutyToReferApi from '../../mockApis/dutyToRefer'
import eligibilityApi from '../../mockApis/eligibility'
import referenceDataApi from '../../mockApis/referenceData'
import {
  auditRecordFactory,
  caseFactory,
  dtrSubmissionFactory,
  dutyToReferFactory,
} from '../../../server/testutils/factories'
import { login } from '../../testUtils'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import DutyToReferPage from '../../pages/cases/dutyToReferPage'
import DutyToReferDetailsPage from '../../pages/cases/dutyToReferDetailsPage'
import { dutyToReferTimelineEntry } from '../../../server/utils/dutyToRefer'

const crn = 'X123456'
const setupStubs = async (initialDutyToRefer: DutyToReferDto) => {
  const caseData = caseFactory.build({ crn })
  await casesApi.stubGetCases([caseData])
  await casesApi.stubGetCaseByCrn(crn, caseData)
  await dutyToReferApi.stubGetCurrentDtr(crn, initialDutyToRefer)
  if (initialDutyToRefer.submission?.id) {
    await dutyToReferApi.stubGetDtrBySubmissionId(crn, initialDutyToRefer.submission.id, initialDutyToRefer)
  }
  await eligibilityApi.stubGetEligibilityByCrn(crn, undefined)
  await casesApi.stubGetReferralHistory(crn, [])
  await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, [])
  await referenceDataApi.stubGetLocalAuthorities()
  return caseData
}

const setupDutyToReferTimeline = async (submissionId: string, records: AuditRecordDto[]) => {
  await dutyToReferApi.stubGetDutyToReferTimeline(crn, submissionId, records)
}

test.describe('duty to refer', () => {
  test('should allow user to submit a duty to refer and add outcome from the Case details page', async ({ page }) => {
    const notStartedDutyToRefer = dutyToReferFactory.notStarted().build({ crn })
    const submittedDutyToRefer = dutyToReferFactory.build({
      ...notStartedDutyToRefer,
      status: 'SUBMITTED',
      submission: dtrSubmissionFactory.build(),
    })
    const acceptedDutyToRefer = dutyToReferFactory.build({
      ...submittedDutyToRefer,
      status: 'ACCEPTED',
    })

    const editId = submittedDutyToRefer.submission.id

    // Given I have stubbed the API responses
    const caseData = await setupStubs(notStartedDutyToRefer)

    // And I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // And I click the add submission details link
    await profileTrackerPage.clickLink('Add submission details')

    // Then I should see the duty to refer guidance page
    const dutyToReferPage = await DutyToReferPage.verifyOnPage(page, 'Submit a duty to refer (DTR)')

    // Then I click the add submission details button
    await dutyToReferPage.clickButton('Add submission details')

    // Then I should see the duty to refer submission form
    await DutyToReferPage.verifyOnPage(page, 'Add Duty to Refer (DTR) submission details')
    await dutyToReferPage.shouldShowSubmissionForm(caseData)

    // When I submit the form with missing fields
    await dutyToReferPage.clickButton('Save and continue')

    // Then I should see errors
    await dutyToReferPage.shouldShowErrorMessagesForFields({
      submissionDate: 'Enter a submission date',
      localAuthorityAreaId: 'Select a local authority',
    })

    // When I complete the form and submit
    await dutyToReferApi.stubSubmitDutyToRefer(crn)
    await dutyToReferApi.stubGetCurrentDtr(crn, submittedDutyToRefer)

    await dutyToReferPage.completeSubmissionForm(submittedDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // And the API should have been called to submit the duty to refer
    await dutyToReferPage.checkApiCalled(crn, submittedDutyToRefer)

    // Then I should see the profile tracker page with the new duty to refer details
    await ProfileTrackerPage.verifyOnPage(page, caseData)
    await profileTrackerPage.shouldShowDutyToRefer(submittedDutyToRefer)

    // When I click the add outcome link
    await dutyToReferApi.stubGetDtrBySubmissionId(crn, editId, submittedDutyToRefer)
    await profileTrackerPage.clickLink('Add outcome')

    // Then I should see the duty to refer outcome form
    const outcomePage = await DutyToReferPage.verifyOnPage(page, 'Add Duty to Refer (DTR) outcome details')
    await outcomePage.shouldShowOutcomePage(caseData, submittedDutyToRefer)

    // When I submit the form with missing fields
    await outcomePage.clickButton('Save and continue')

    // Then I should see errors
    await outcomePage.shouldShowErrorMessagesForFields({
      outcomeStatus: 'Select duty to refer outcome',
    })

    // When I complete the form and submit
    await dutyToReferApi.stubUpdateDutyToRefer(crn, editId)
    await dutyToReferApi.stubGetCurrentDtr(crn, acceptedDutyToRefer)

    await outcomePage.completeOutcomeForm(acceptedDutyToRefer)
    await outcomePage.clickButton('Save and continue')

    // Then the API should have been called to update the duty to refer
    await outcomePage.checkApiCalled(crn, acceptedDutyToRefer, 'update')

    // And I should see the profile tracker page with the updated duty to refer details
    await ProfileTrackerPage.verifyOnPage(page, caseData)
    await profileTrackerPage.shouldShowDutyToRefer(acceptedDutyToRefer)

    // And I should see a success banner confirming outcome details were added
    await profileTrackerPage.shouldShowBanner('Outcome details added')
  })

  test('should allow the user to view the details of a submitted duty to refer and add outcome from the DTR details page', async ({
    page,
  }) => {
    const submittedDutyToRefer = dutyToReferFactory.submitted().build({ crn })
    const notAcceptedDutyToRefer = dutyToReferFactory.build({
      ...submittedDutyToRefer,
      status: 'NOT_ACCEPTED',
    })
    const submissionAddedDutyReferRecord = auditRecordFactory.dutyToReferAdded(submittedDutyToRefer.submission).build()
    const outcomeAddedDutyToReferRecord = auditRecordFactory
      .dutyToReferAdded(notAcceptedDutyToRefer.submission, notAcceptedDutyToRefer.status, {
        localAuthorityAreaName: notAcceptedDutyToRefer.submission.localAuthority.localAuthorityAreaName,
      })
      .build()
    const noteDutyToReferRecord = auditRecordFactory.note('This is a note\n\nWith line breaks').build()

    const editId = submittedDutyToRefer.submission.id

    // Given I have stubbed the API responses
    const caseData = await setupStubs(submittedDutyToRefer)
    const timelineRecords: AuditRecordDto[] = [submissionAddedDutyReferRecord]
    await setupDutyToReferTimeline(editId, timelineRecords)

    // Given I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // Then I click the link to view duty to refer details in the dtr card
    await profileTrackerPage.clickLink('View referral and notes', profileTrackerPage.getCard('Duty to Refer (DTR)'))

    // Then I should see the duty to refer details page
    const dutyToReferDetailsPage = await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')

    // And the outcome details section should be empty
    await dutyToReferDetailsPage.shouldShowEmptyOutcomeDetails()

    // And I should see a timeline entry showing the duty to refer was submitted
    await dutyToReferDetailsPage.shouldShowTimelineEntry(dutyToReferTimelineEntry(submissionAddedDutyReferRecord))

    // Then I click the Add outcome button
    await dutyToReferDetailsPage.clickButton('Add outcome')

    // Then I should see the duty to refer outcome form
    const outcomePage = await DutyToReferPage.verifyOnPage(page, 'Add Duty to Refer (DTR) outcome details')

    // When I complete the form and submit
    await dutyToReferApi.stubUpdateDutyToRefer(crn, editId)
    await dutyToReferApi.stubGetDtrBySubmissionId(crn, editId, notAcceptedDutyToRefer)
    timelineRecords.unshift(outcomeAddedDutyToReferRecord)
    await setupDutyToReferTimeline(submittedDutyToRefer.submission.id, timelineRecords)

    await outcomePage.completeOutcomeForm(notAcceptedDutyToRefer)
    await outcomePage.clickButton('Save and continue')

    // Then the API should have been called to update the duty to refer
    await outcomePage.checkApiCalled(crn, notAcceptedDutyToRefer, 'update')

    // And I should see the duty to refer details page with updated outcome details
    await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldShowOutcomeDetails(notAcceptedDutyToRefer)
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(notAcceptedDutyToRefer)

    // And I should see a success banner confirming outcome details were added
    await dutyToReferDetailsPage.shouldShowBanner('Outcome details added')

    // And I should see a timeline entry showing the outcome details were added
    await dutyToReferDetailsPage.shouldShowTimelineEntry(dutyToReferTimelineEntry(outcomeAddedDutyToReferRecord))

    // When I click the Add note button without entering a note
    await dutyToReferDetailsPage.clickButton('Add note')

    // Then I should see an error
    await dutyToReferDetailsPage.shouldShowErrorMessagesForFields({
      note: 'Enter a note',
    })

    // When I enter a note and submit
    await dutyToReferApi.stubSubmitDutyToReferTimelineNote(crn, notAcceptedDutyToRefer.submission.id)
    timelineRecords.unshift(noteDutyToReferRecord)
    await setupDutyToReferTimeline(notAcceptedDutyToRefer.submission.id, timelineRecords)

    await dutyToReferDetailsPage.completeInputByLabel('Add note', 'This is a note\n\nWith line breaks')
    await dutyToReferDetailsPage.clickButton('Add note')

    // Then I should see a success banner
    await dutyToReferDetailsPage.shouldShowBanner('Note added')

    // And I should see a timeline entry showing a note was added
    await dutyToReferDetailsPage.shouldShowTimelineEntry(dutyToReferTimelineEntry(noteDutyToReferRecord))
  })

  test('should allow the user to edit submission details', async ({ page }) => {
    const submittedDutyToRefer = dutyToReferFactory.submitted().build({ crn })
    const submissionId = submittedDutyToRefer.submission.id
    const updatedDutyToRefer = dutyToReferFactory.build({
      ...submittedDutyToRefer,
      submission: dtrSubmissionFactory.build({ id: submissionId }),
    })
    const submittedDutyToReferRecord = auditRecordFactory.dutyToReferAdded(submittedDutyToRefer.submission).build()
    const updatedDutyToReferRecord = auditRecordFactory.dutyToReferUpdated(submittedDutyToRefer.submission).build()
    const timelineRecords: AuditRecordDto[] = [submittedDutyToReferRecord]

    // Given I have stubbed the API responses
    const caseData = await setupStubs(submittedDutyToRefer)
    await setupDutyToReferTimeline(submittedDutyToRefer.submission.id, timelineRecords)

    // Given I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // Then I click the link to view duty to refer details in the dtr card
    await profileTrackerPage.clickLink('View referral and notes', profileTrackerPage.getCard('Duty to Refer (DTR)'))

    // Then I should see the duty to refer details page
    const dutyToReferDetailsPage = await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')

    // And the person's profile should be shown
    await dutyToReferDetailsPage.shouldShowCaseDetails(caseData)

    // And the submission details should be shown
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(submittedDutyToRefer)

    // Then I click the Edit submission details button
    await dutyToReferDetailsPage.clickButton('Edit submission details')

    // Then I should see the duty to refer edit submission form
    const dutyToReferPage = await DutyToReferPage.verifyOnPage(page, 'Edit Duty to Refer (DTR) submission details')
    await dutyToReferPage.shouldShowSubmissionForm(caseData)

    // When I submit the form with missing fields
    await dutyToReferPage.clickButton('Save and continue')

    // Then I should see errors
    await dutyToReferPage.shouldShowErrorMessagesForFields({
      submissionDate: 'Enter a submission date',
      localAuthorityAreaId: 'Select a local authority',
    })

    // When I complete the form and submit
    await dutyToReferApi.stubUpdateDutyToRefer(crn, submissionId)
    await dutyToReferApi.stubGetDtrBySubmissionId(crn, submissionId, updatedDutyToRefer)
    timelineRecords.unshift(updatedDutyToReferRecord)
    await setupDutyToReferTimeline(submittedDutyToRefer.submission.id, timelineRecords)

    await dutyToReferPage.completeSubmissionForm(updatedDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // And the API should have been called to update the duty to refer
    await dutyToReferPage.checkApiCalled(crn, updatedDutyToRefer, 'update')

    // Then I should see the duty to refer details page with updated submission details
    await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(updatedDutyToRefer)

    // And I should see a success banner confirming submission details were updated
    await dutyToReferDetailsPage.shouldShowBanner('Submission details updated')

    // And I should see a timeline entry showing the submission details were updated
    await dutyToReferDetailsPage.shouldShowTimelineEntry(dutyToReferTimelineEntry(updatedDutyToReferRecord))
  })

  test('should allow the user to edit outcome details', async ({ page }) => {
    const acceptedDutyToRefer = dutyToReferFactory.accepted().build({ crn })
    const submissionId = acceptedDutyToRefer.submission.id
    const updatedDutyToRefer = dutyToReferFactory.build({ ...acceptedDutyToRefer, status: 'NOT_ACCEPTED' })

    // Given I have stubbed the API responses
    const caseData = await setupStubs(acceptedDutyToRefer)
    const submittedDutyToReferRecord = auditRecordFactory.dutyToReferAdded(acceptedDutyToRefer.submission).build()
    const updatedDutyToReferRecord = auditRecordFactory
      .dutyToReferUpdated(acceptedDutyToRefer.submission, updatedDutyToRefer.status, {
        localAuthorityAreaName: acceptedDutyToRefer.submission.localAuthority.localAuthorityAreaName,
      })
      .build()
    const timelineRecords: AuditRecordDto[] = [submittedDutyToReferRecord]
    await setupDutyToReferTimeline(acceptedDutyToRefer.submission.id, timelineRecords)

    // Given I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // Then I click the link to view duty to refer details in the dtr card
    await profileTrackerPage.clickLink('View referral and notes', profileTrackerPage.getCard('Duty to Refer (DTR)'))

    // Then I should see the duty to refer details page
    const dutyToReferDetailsPage = await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')

    // And the person's profile should be shown
    await dutyToReferDetailsPage.shouldShowCaseDetails(caseData)

    // And the outcome details should be shown
    await dutyToReferDetailsPage.shouldShowOutcomeDetails(acceptedDutyToRefer)

    // Then I click the Edit outcome details button
    await dutyToReferDetailsPage.clickButton('Edit outcome details')

    // Then I should see the duty to refer edit outcome form
    const dutyToReferPage = await DutyToReferPage.verifyOnPage(page, 'Edit Duty to Refer (DTR) outcome details')
    await dutyToReferPage.shouldShowOutcomePage(caseData, acceptedDutyToRefer)

    // When I submit the form with missing fields
    await dutyToReferPage.clickButton('Save and continue')

    // Then I should see errors
    await dutyToReferPage.shouldShowErrorMessagesForFields({
      outcomeStatus: 'Select duty to refer outcome',
    })

    // When I complete the form and submit
    await dutyToReferApi.stubUpdateDutyToRefer(crn, submissionId)
    await dutyToReferApi.stubGetDtrBySubmissionId(crn, submissionId, updatedDutyToRefer)
    timelineRecords.unshift(updatedDutyToReferRecord)
    await setupDutyToReferTimeline(acceptedDutyToRefer.submission.id, timelineRecords)

    await dutyToReferPage.completeOutcomeForm(updatedDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // And the API should have been called to update the duty to refer
    await dutyToReferPage.checkApiCalled(crn, updatedDutyToRefer, 'update')

    // Then I should see the duty to refer details page with updated outcome details
    await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldShowOutcomeDetails(updatedDutyToRefer)

    // And I should see a success banner confirming outcome details were updated
    await dutyToReferDetailsPage.shouldShowBanner('Outcome details updated')

    // And I should see a timeline entry showing the outcome details were updated
    await dutyToReferDetailsPage.shouldShowTimelineEntry(dutyToReferTimelineEntry(updatedDutyToReferRecord))
  })
})
