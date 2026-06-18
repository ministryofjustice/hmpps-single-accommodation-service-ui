import { test } from '@playwright/test'
import { AuditRecordDto, CaseDto, DutyToReferDto } from '@sas/api'
import accommodationApi from '../../mockApis/accommodation'
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
  eligibilityFactory,
  dtrServiceResultFactory,
  referralFactory,
} from '../../../server/testutils/factories'
import { login } from '../../testUtils'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import DutyToReferPage from '../../pages/cases/dutyToReferPage'
import DutyToReferDetailsPage from '../../pages/cases/dutyToReferDetailsPage'
import {
  dutyToReferStatusCard,
  dutyToReferTimelineEntry,
  dutyToReferToDtrServiceResult,
} from '../../../server/utils/dutyToRefer'

const crn = 'X123456'
const setupStubs = async ({
  initialCaseData,
  initialDutyToRefer,
}: {
  initialCaseData?: CaseDto
  initialDutyToRefer?: DutyToReferDto
} = {}) => {
  const caseData = initialCaseData || caseFactory.build({ crn })
  await casesApi.stubGetCases([caseData])
  await casesApi.stubGetCaseByCrn(crn, caseData)
  if (initialDutyToRefer?.submission?.id) {
    await dutyToReferApi.stubGetDtrBySubmissionId(crn, initialDutyToRefer.submission.id, initialDutyToRefer)
  }
  const eligibility = eligibilityFactory.build({
    crn,
    dtr: initialDutyToRefer
      ? dutyToReferToDtrServiceResult(initialDutyToRefer)
      : dtrServiceResultFactory.notStarted().build(),
  })
  await eligibilityApi.stubGetEligibilityByCrn(crn, eligibility)
  await casesApi.stubGetReferralHistory(crn, [])
  await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, [])
  await accommodationApi.stubGetAccommodationHistory(crn, [])
  await referenceDataApi.stubGetLocalAuthorities()
  await accommodationApi.stubGetCurrentAccommodation(crn, undefined)
  await accommodationApi.stubGetNextAccommodation(crn, undefined)
  return { caseData, eligibility }
}

const setupDutyToReferTimeline = async (submissionId: string, records: AuditRecordDto[]) => {
  await dutyToReferApi.stubGetDutyToReferTimeline(crn, submissionId, records)
}

test.describe('duty to refer', () => {
  test('should allow user to submit a duty to refer, view details and add an outcome from the DTR details page', async ({
    page,
  }) => {
    const submittedDutyToRefer = dutyToReferFactory.submitted().build({ crn })
    const notAcceptedDutyToRefer = dutyToReferFactory.build({
      ...submittedDutyToRefer,
      status: 'NOT_ACCEPTED',
      submission: {
        ...submittedDutyToRefer.submission,
        outcomeReason: 'INTENTIONALLY_HOMELESS',
      },
    })
    const submissionAddedDutyReferRecord = auditRecordFactory.dutyToReferAdded(submittedDutyToRefer.submission).build()
    const outcomeAddedDutyToReferRecord = auditRecordFactory
      .dutyToReferUpdated(
        notAcceptedDutyToRefer.submission,
        notAcceptedDutyToRefer.status,
        {
          localAuthorityAreaName: notAcceptedDutyToRefer.submission.localAuthority.localAuthorityAreaName,
        },
        'SUBMITTED',
      )
      .build()
    const noteDutyToReferRecord = auditRecordFactory.note('This is a note\n\nWith line breaks').build()

    const editId = submittedDutyToRefer.submission.id

    // Given I have stubbed the API responses
    const { caseData } = await setupStubs()
    const timelineRecords: AuditRecordDto[] = []
    await setupDutyToReferTimeline(editId, timelineRecords)

    // And I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // And I click the add referral details link
    await profileTrackerPage.clickLink('Add referral details')

    // Then I should see the duty to refer submission form
    const dutyToReferPage = await DutyToReferPage.verifyOnPage(page, 'Add Duty to Refer (DTR) referral details')
    await dutyToReferPage.shouldShowCaseSummary(caseData)

    // When I submit the form with missing fields
    await dutyToReferPage.clickButton('Save and continue')

    // Then I should see errors
    await DutyToReferPage.verifyOnPage(page, 'Add Duty to Refer (DTR) referral details')
    await dutyToReferPage.shouldShowErrorMessagesForFields({
      submissionDate: 'Enter a submission date',
      localAuthorityAreaId: 'Select a local authority',
    })

    // When I complete the form and submit
    await dutyToReferApi.stubSubmitDutyToRefer(crn, submittedDutyToRefer)
    const { eligibility } = await setupStubs({ initialCaseData: caseData, initialDutyToRefer: submittedDutyToRefer })
    timelineRecords.unshift(submissionAddedDutyReferRecord)
    await setupDutyToReferTimeline(editId, timelineRecords)

    await dutyToReferPage.completeSubmissionForm(submittedDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // Then the API should have been called to submit the duty to refer
    await dutyToReferPage.checkApiCalled(crn, submittedDutyToRefer)

    // And I should see the case details page
    await ProfileTrackerPage.verifyOnPage(page, caseData)

    // And I should see a success banner confirming referral details were added
    await profileTrackerPage.shouldShowBanner('New DTR referral details added')

    // And I should see the new DTR eligibility card
    await profileTrackerPage.shouldShowCard('Duty to refer (DTR)', dutyToReferStatusCard(crn, eligibility.dtr))

    // When I click on the DTR link
    await profileTrackerPage.clickLink('View referral', profileTrackerPage.getCard('Duty to Refer (DTR)'))

    // Then I should see the duty to refer details page
    const dutyToReferDetailsPage = await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(submittedDutyToRefer)
    await dutyToReferDetailsPage.shouldShowAddOutcomeButton()
    await dutyToReferDetailsPage.shouldShowWithdrawReferralButton()
    await dutyToReferDetailsPage.shouldShowAddNewReferralButton()

    // And I should see a timeline entry showing the duty to refer was submitted
    await dutyToReferDetailsPage.shouldShowTimelineEntry(dutyToReferTimelineEntry(submissionAddedDutyReferRecord))

    // Then I click the Add outcome button
    await dutyToReferDetailsPage.clickButton('Add outcome')

    // Then I should see the duty to refer outcome form
    const outcomePage = await DutyToReferPage.verifyOnPage(page, 'Add Duty to Refer (DTR) outcome')
    await outcomePage.shouldShowOutcomePage(caseData, submittedDutyToRefer)

    // When I submit the form with missing fields
    await outcomePage.clickButton('Save and continue')

    // Then I should see errors
    await outcomePage.shouldShowErrorMessagesForFields({
      outcomeReason: 'Select duty to refer outcome',
    })

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
    await dutyToReferDetailsPage.shouldNotShowAddOutcomeButton()
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(notAcceptedDutyToRefer)
    await dutyToReferDetailsPage.shouldShowOutcomeDetails(notAcceptedDutyToRefer)
    await dutyToReferDetailsPage.shouldShowWithdrawReferralButton()
    await dutyToReferDetailsPage.shouldShowAddNewReferralButton()

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
    const updatedDutyToRefer = dutyToReferFactory.submitted().build({
      ...submittedDutyToRefer,
      submission: dtrSubmissionFactory.build({ id: submissionId }),
    })
    const submittedDutyToReferRecord = auditRecordFactory.dutyToReferAdded(submittedDutyToRefer.submission).build()
    const updatedDutyToReferRecord = auditRecordFactory.dutyToReferUpdated(submittedDutyToRefer.submission).build()
    const timelineRecords: AuditRecordDto[] = [submittedDutyToReferRecord]

    // Given I have stubbed the API responses
    const { caseData } = await setupStubs({ initialDutyToRefer: submittedDutyToRefer })
    await setupDutyToReferTimeline(submittedDutyToRefer.submission.id, timelineRecords)

    // Given I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // Then I click the link to view duty to refer details in the dtr card
    await profileTrackerPage.clickLink('View referral', profileTrackerPage.getCard('Duty to Refer (DTR)'))

    // Then I should see the duty to refer details page
    const dutyToReferDetailsPage = await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldShowAddOutcomeButton()

    // And the person's profile should be shown
    await dutyToReferDetailsPage.shouldShowCaseDetails(caseData)

    // And the submission details should be shown
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(submittedDutyToRefer)

    // Then I click the change button on submission details
    await dutyToReferDetailsPage.clickLink('Change', dutyToReferDetailsPage.getSummaryCard('Referral details'))

    // Then I should see the duty to refer edit submission form
    const dutyToReferPage = await DutyToReferPage.verifyOnPage(page, 'Edit Duty to Refer (DTR) referral details')
    await dutyToReferPage.shouldShowCaseSummary(caseData)
    await dutyToReferPage.shouldShowPopulatedSubmissionForm(submittedDutyToRefer)

    // When I clear the submission date and submit
    await dutyToReferPage.clearDateInputByLabel('When was the DTR submitted?')
    await dutyToReferPage.clickButton('Save and continue')

    // Then I should see errors
    await DutyToReferPage.verifyOnPage(page, 'Edit Duty to Refer (DTR) referral details')
    await dutyToReferPage.shouldShowErrorMessagesForFields({
      submissionDate: 'Enter a submission date',
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
    await dutyToReferDetailsPage.shouldShowAddOutcomeButton()
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(updatedDutyToRefer)

    // And I should see a success banner confirming submission details were updated
    await dutyToReferDetailsPage.shouldShowBanner('Submission details updated')

    // And I should see a timeline entry showing the submission details were updated
    await dutyToReferDetailsPage.shouldShowTimelineEntry(dutyToReferTimelineEntry(updatedDutyToReferRecord))
  })

  test('should allow the user to edit a submission with an outcome', async ({ page }) => {
    const acceptedDutyToRefer = dutyToReferFactory.accepted().build({ crn })
    const submissionId = acceptedDutyToRefer.submission.id
    const updatedSubmission = dtrSubmissionFactory.build({ id: submissionId })
    const updatedDutyToRefer = dutyToReferFactory.build({
      ...acceptedDutyToRefer,
      submission: { ...updatedSubmission, outcomeReason: acceptedDutyToRefer.submission.outcomeReason },
    })
    const submittedDutyToReferRecord = auditRecordFactory.dutyToReferAdded(acceptedDutyToRefer.submission).build()
    const outcomeDutyToReferRecord = auditRecordFactory
      .dutyToReferUpdated(
        acceptedDutyToRefer.submission,
        'ACCEPTED',
        { localAuthorityName: acceptedDutyToRefer.submission.localAuthority.localAuthorityAreaName },
        'SUBMITTED',
      )
      .build()
    const updatedDutyToReferRecord = auditRecordFactory.dutyToReferUpdated(updatedSubmission).build()
    const timelineRecords: AuditRecordDto[] = [outcomeDutyToReferRecord, submittedDutyToReferRecord]

    // Given I have stubbed the API responses
    const { caseData } = await setupStubs({ initialDutyToRefer: acceptedDutyToRefer })
    await setupDutyToReferTimeline(acceptedDutyToRefer.submission.id, timelineRecords)

    // Given I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // Then I click the link to view duty to refer details in the dtr card
    await profileTrackerPage.clickLink('View referral', profileTrackerPage.getCard('Duty to Refer (DTR)'))

    // Then I should see the duty to refer details page
    const dutyToReferDetailsPage = await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldNotShowAddOutcomeButton()

    // And the submission details should be shown
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(acceptedDutyToRefer)

    // And the outcome details should be shown
    await dutyToReferDetailsPage.shouldShowOutcomeDetails(acceptedDutyToRefer)

    // Then I click the change button on submission details
    await dutyToReferDetailsPage.clickLink('Change', dutyToReferDetailsPage.getSummaryCard('Referral details'))

    // Then I should see the duty to refer edit submission form
    const dutyToReferPage = await DutyToReferPage.verifyOnPage(page, 'Edit Duty to Refer (DTR) referral details')
    await dutyToReferPage.shouldShowCaseSummary(caseData)
    await dutyToReferPage.shouldShowPopulatedSubmissionForm(acceptedDutyToRefer)

    // When I complete the form and submit
    await dutyToReferApi.stubUpdateDutyToRefer(crn, submissionId)
    await dutyToReferApi.stubGetDtrBySubmissionId(crn, submissionId, updatedDutyToRefer)
    timelineRecords.unshift(updatedDutyToReferRecord)
    await setupDutyToReferTimeline(acceptedDutyToRefer.submission.id, timelineRecords)

    await dutyToReferPage.completeSubmissionForm(updatedDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // And the API should have been called to update the duty to refer
    await dutyToReferPage.checkApiCalled(crn, updatedDutyToRefer, 'update')

    // Then I should see the duty to refer details page with updated submission details
    await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldNotShowAddOutcomeButton()
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(updatedDutyToRefer)

    // And I should see a success banner confirming submission details were updated
    await dutyToReferDetailsPage.shouldShowBanner('Submission details updated')

    // And I should see a timeline entry showing the submission details were updated
    await dutyToReferDetailsPage.shouldShowTimelineEntry(dutyToReferTimelineEntry(updatedDutyToReferRecord))
  })

  test('should allow the user to edit outcome details', async ({ page }) => {
    const acceptedDutyToRefer = dutyToReferFactory.accepted().build({ crn })
    const submissionId = acceptedDutyToRefer.submission.id
    const updatedDutyToRefer = dutyToReferFactory.build({
      ...acceptedDutyToRefer,
      status: 'NOT_ACCEPTED',
      submission: {
        ...acceptedDutyToRefer.submission,
        outcomeReason: 'INTENTIONALLY_HOMELESS',
      },
    })

    // Given I have stubbed the API responses
    const { caseData } = await setupStubs({ initialDutyToRefer: acceptedDutyToRefer })
    const submittedDutyToReferRecord = auditRecordFactory.dutyToReferAdded(acceptedDutyToRefer.submission).build()
    const updatedDutyToReferRecord = auditRecordFactory
      .dutyToReferUpdated(
        acceptedDutyToRefer.submission,
        updatedDutyToRefer.status,
        {
          localAuthorityAreaName: acceptedDutyToRefer.submission.localAuthority.localAuthorityAreaName,
        },
        'SUBMITTED',
      )
      .build()
    const timelineRecords: AuditRecordDto[] = [submittedDutyToReferRecord]
    await setupDutyToReferTimeline(acceptedDutyToRefer.submission.id, timelineRecords)

    // Given I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // Then I click the link to view duty to refer details in the dtr card
    await profileTrackerPage.clickLink('View referral', profileTrackerPage.getCard('Duty to Refer (DTR)'))

    // Then I should see the duty to refer details page
    const dutyToReferDetailsPage = await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldNotShowAddOutcomeButton()

    // And the person's profile should be shown
    await dutyToReferDetailsPage.shouldShowCaseDetails(caseData)

    // And the outcome details should be shown
    await dutyToReferDetailsPage.shouldShowOutcomeDetails(acceptedDutyToRefer)

    // Then I click the Change link on outcome details
    await dutyToReferDetailsPage.clickLink('Change', dutyToReferDetailsPage.getSummaryCard('Outcome details'))

    // Then I should see the duty to refer edit outcome form
    const dutyToReferPage = await DutyToReferPage.verifyOnPage(page, 'Edit Duty to Refer (DTR) outcome')
    await dutyToReferPage.shouldShowOutcomePage(caseData, acceptedDutyToRefer)

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
    await dutyToReferDetailsPage.shouldNotShowAddOutcomeButton()
    await dutyToReferDetailsPage.shouldShowOutcomeDetails(updatedDutyToRefer)

    // And I should see a success banner confirming outcome details were updated
    await dutyToReferDetailsPage.shouldShowBanner('Outcome details updated')

    // And I should see a timeline entry showing the outcome details were updated
    await dutyToReferDetailsPage.shouldShowTimelineEntry(dutyToReferTimelineEntry(updatedDutyToReferRecord))
  })

  test('should allow the user to withdraw a submitted duty to refer', async ({ page }) => {
    const submittedDutyToRefer = dutyToReferFactory.submitted().build({ crn })
    const withdrawnDutyToRefer = dutyToReferFactory.build({
      ...submittedDutyToRefer,
      status: 'WITHDRAWN',
      submission: {
        ...submittedDutyToRefer.submission,
        withdrawalReason: 'NEW_REFERRAL',
      },
    })
    const submissionAddedDutyReferRecord = auditRecordFactory.dutyToReferAdded(submittedDutyToRefer.submission).build()

    const editId = submittedDutyToRefer.submission.id

    // Given I have stubbed the API responses
    const { caseData } = await setupStubs({ initialDutyToRefer: submittedDutyToRefer })
    const timelineRecords: AuditRecordDto[] = [submissionAddedDutyReferRecord]
    await setupDutyToReferTimeline(editId, timelineRecords)

    // Given I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // Then I click the link to view duty to refer details in the dtr card
    await profileTrackerPage.clickLink('View referral', profileTrackerPage.getCard('Duty to Refer (DTR)'))

    // Then I should see the duty to refer details page
    const dutyToReferDetailsPage = await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldShowAddOutcomeButton()

    // And I should see a timeline entry showing the duty to refer was submitted
    await dutyToReferDetailsPage.shouldShowTimelineEntry(dutyToReferTimelineEntry(submissionAddedDutyReferRecord))

    // And I click the Withdraw referral button
    await dutyToReferDetailsPage.clickButton('Withdraw referral')

    // Then I should see the duty to refer withdrawal form
    const dutyToReferWithdrawPage = await DutyToReferPage.verifyOnPage(page, 'Withdraw referral')

    // When I submit the form with missing fields
    await dutyToReferWithdrawPage.clickButton('Withdraw referral')

    // Then I should see errors
    await dutyToReferWithdrawPage.shouldShowErrorMessagesForFields({
      withdrawalReason: 'Select a reason for withdrawal',
    })

    // When I complete the form and submit
    await dutyToReferApi.stubUpdateDutyToRefer(crn, editId)
    const eligibility = eligibilityFactory.build({ crn })
    await eligibilityApi.stubGetEligibilityByCrn(crn, eligibility)
    const referrals = [
      referralFactory.dtrReferral().build({
        id: submittedDutyToRefer.submission.id,
        status: 'WITHDRAWN',
        placementStatus: 'WITHDRAWN',
        referralRejectionReason: withdrawnDutyToRefer.submission.withdrawalReason,
        localAuthorityArea: submittedDutyToRefer.submission.localAuthority.localAuthorityAreaName,
      }),
    ]
    await casesApi.stubGetReferralHistory(crn, referrals)
    await dutyToReferWithdrawPage.completeWithdrawalForm(withdrawnDutyToRefer)
    await dutyToReferWithdrawPage.clickButton('Withdraw referral')

    // Then the API should have been called to update the duty to refer
    await dutyToReferWithdrawPage.checkApiCalled(crn, withdrawnDutyToRefer, 'update')

    // And I should see the profile tracker page with a not started duty to refer
    await ProfileTrackerPage.verifyOnPage(page, caseData)
    await profileTrackerPage.shouldShowEligibility(eligibility)

    // And I should see a success banner confirming the referral was withdrawn
    await profileTrackerPage.shouldShowBanner('DTR referral withdrawn')

    // And I should see the withdrawn dtr in the referral history
    await profileTrackerPage.shouldShowReferralHistory(referrals)

    // And I click the View referral link for the withdrawn dtr
    await dutyToReferApi.stubGetDtrBySubmissionId(crn, editId, withdrawnDutyToRefer)
    const withdrawnDutyToReferRecord = auditRecordFactory
      .dutyToReferUpdated(withdrawnDutyToRefer.submission, withdrawnDutyToRefer.status)
      .build()
    await dutyToReferApi.stubGetDutyToReferTimeline(crn, editId, [
      withdrawnDutyToReferRecord,
      submissionAddedDutyReferRecord,
    ])
    await profileTrackerPage.clickLink('View referral', profileTrackerPage.getSummaryCard('Referral history'))

    // Then I should see the duty to refer details page
    await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldShowReferralHistoryCaption()
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(withdrawnDutyToRefer)
    await dutyToReferDetailsPage.shouldNotShowOutcomeDetails()
    await dutyToReferDetailsPage.shouldNotShowAddOutcomeButton()
    await dutyToReferDetailsPage.shouldNotShowWithdrawReferralButton()
    await dutyToReferDetailsPage.shouldNotShowAddNewReferralButton()

    // And I should see a timeline entry showing the duty to refer was withdrawn
    await dutyToReferDetailsPage.shouldShowTimelineEntry(dutyToReferTimelineEntry(withdrawnDutyToReferRecord))
  })

  test('should allow the user to add a new referral', async ({ page }) => {
    const existingDutyToRefer = dutyToReferFactory.submitted().build({ crn })
    const newDutyToRefer = dutyToReferFactory.submitted().build({ crn })

    // Given I have stubbed the API responses
    const { caseData } = await setupStubs({ initialDutyToRefer: existingDutyToRefer })
    await setupDutyToReferTimeline(existingDutyToRefer.submission.id, [
      auditRecordFactory.dutyToReferAdded(existingDutyToRefer.submission).build(),
    ])
    await setupDutyToReferTimeline(newDutyToRefer.submission.id, [
      auditRecordFactory.dutyToReferAdded(newDutyToRefer.submission).build(),
    ])

    // Given I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // Then I click the link to view duty to refer details in the dtr card
    await profileTrackerPage.clickLink('View referral', profileTrackerPage.getCard('Duty to Refer (DTR)'))

    let dutyToReferDetailsPage = await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')

    // When I click the 'Add new referral' button
    await dutyToReferDetailsPage.clickButton('Add new referral')

    // Then I should see the duty to refer add submission form
    const dutyToReferPage = await DutyToReferPage.verifyOnPage(page, 'Add new Duty to Refer (DTR) referral details')

    // When I submit the form with missing fields
    await dutyToReferPage.clickButton('Save and continue')

    // Then I should see errors
    await DutyToReferPage.verifyOnPage(page, 'Add new Duty to Refer (DTR) referral details')
    await dutyToReferPage.shouldShowErrorMessagesForFields({
      submissionDate: 'Enter a submission date',
      localAuthorityAreaId: 'Select a local authority',
    })

    // When I complete the form and submit
    await dutyToReferApi.stubSubmitDutyToRefer(crn, newDutyToRefer)
    const { eligibility } = await setupStubs({ initialCaseData: caseData, initialDutyToRefer: newDutyToRefer })

    await dutyToReferPage.completeSubmissionForm(newDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // Then the API should have been called to submit the duty to refer
    await dutyToReferPage.checkApiCalled(crn, newDutyToRefer)

    // And I should see the case details page
    await ProfileTrackerPage.verifyOnPage(page, caseData)

    // And I should see a success banner confirming referral details were added
    await profileTrackerPage.shouldShowBanner(
      'New DTR referral details added',
      `The previous referral has been moved to ${caseData.name}'s referral history`,
    )

    // And I should see the new DTR eligibility card
    await profileTrackerPage.shouldShowCard('Duty to refer (DTR)', dutyToReferStatusCard(crn, eligibility.dtr))

    // When I click on the DTR link
    await profileTrackerPage.clickLink('View referral', profileTrackerPage.getCard('Duty to Refer (DTR)'))

    // Then I should see the new duty to refer details page
    dutyToReferDetailsPage = await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(newDutyToRefer)
    await dutyToReferDetailsPage.shouldShowAddOutcomeButton()
    await dutyToReferDetailsPage.shouldShowWithdrawReferralButton()
    await dutyToReferDetailsPage.shouldShowAddNewReferralButton()
  })
})
