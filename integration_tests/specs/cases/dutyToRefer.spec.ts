import { test } from '@playwright/test'
import { DutyToReferDto } from '@sas/api'
import casesApi from '../../mockApis/cases'
import proposedAddressesApi from '../../mockApis/proposedAddresses'
import dutyToReferApi from '../../mockApis/dutyToRefer'
import eligibilityApi from '../../mockApis/eligibility'
import referenceDataApi from '../../mockApis/referenceData'
import {
  caseFactory,
  dtrCommandFactory,
  dutyToReferFactory,
  referenceDataFactory,
} from '../../../server/testutils/factories'
import { login } from '../../testUtils'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import DutyToReferPage from '../../pages/cases/dutyToReferPage'
import DutyToReferDetailsPage from '../../pages/cases/dutyToReferDetailsPage'

test.describe('duty to refer', () => {
  const crn = 'X123456'

  const setupStubs = async (initialDutyToRefer: DutyToReferDto) => {
    const caseData = caseFactory.build({ crn })
    await casesApi.stubGetCases([caseData])
    await casesApi.stubGetCaseByCrn(crn, caseData)
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, initialDutyToRefer)
    await eligibilityApi.stubGetEligibilityByCrn(crn, undefined)
    await casesApi.stubGetReferralHistory(crn, [])
    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, [])
    return caseData
  }

  test('should allow user to submit a duty to refer and add outcome', async ({ page }) => {
    const localAuthority = referenceDataFactory.localAuthority().build()
    const notStartedDutyToRefer = dutyToReferFactory.notStarted().build({ crn })
    const submittedCommand = dtrCommandFactory.build({
      localAuthorityAreaId: localAuthority.id,
    })
    const submittedDutyToRefer = dutyToReferFactory.fromSubmission(submittedCommand, localAuthority.name).build({ crn })

    const acceptedCommand = dtrCommandFactory.build({ ...submittedCommand, status: 'ACCEPTED' })
    const acceptedDutyToRefer = dutyToReferFactory.fromSubmission(acceptedCommand, localAuthority.name).build({ crn })

    // Given I have stubbed the API responses
    const caseData = await setupStubs(notStartedDutyToRefer)
    await referenceDataApi.stubGetLocalAuthorities()

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
    await dutyToReferPage.shouldShowSubmissionForm(caseData)

    // When I submit the form with missing fields
    await dutyToReferPage.clickButton('Save and continue')

    // Then I should see errors
    await dutyToReferPage.shouldShowErrorMessagesForFields({
      submissionDate: 'Enter a submission date',
      localAuthorityAreaId: 'Select a local authority',
    })

    // When I complete the form and submit
    await dutyToReferPage.completeSubmissionForm(submittedCommand, localAuthority.name)
    await dutyToReferApi.stubSubmitDutyToRefer(crn)
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, submittedDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // And the API should have been called to submit the duty to refer
    await dutyToReferPage.checkApiCalled(crn, submittedCommand)

    // Then I should see the profile tracker page with the new duty to refer details
    await ProfileTrackerPage.verifyOnPage(page, caseData)
    await profileTrackerPage.shouldShowDutyToRefer(submittedDutyToRefer)

    // When I click the add outcome link
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, acceptedDutyToRefer)
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
    await outcomePage.completeOutcomeForm(acceptedCommand)
    await dutyToReferApi.stubUpdateDutyToRefer(crn, acceptedDutyToRefer.submission.id)
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, acceptedDutyToRefer)
    await outcomePage.clickButton('Save and continue')

    // And the API should have been called to update the duty to refer
    await outcomePage.checkApiCalled(crn, acceptedCommand, 'update', acceptedDutyToRefer.submission.id)

    // Then I should see the profile tracker page with the updated duty to refer details
    await ProfileTrackerPage.verifyOnPage(page, caseData)
    await profileTrackerPage.shouldShowDutyToRefer(acceptedDutyToRefer)
  })

  test('should allow user to add not accepted outcome to an existing duty to refer', async ({ page }) => {
    const id = 'dtr-id-123'
    const localAuthority = referenceDataFactory.localAuthority().build()
    const submittedCommand = dtrCommandFactory.build({ status: 'SUBMITTED', localAuthorityAreaId: localAuthority.id })
    const submittedDutyToRefer = dutyToReferFactory
      .fromSubmission(submittedCommand, localAuthority.name)
      .build({ crn, submission: { id } })

    const notAcceptedCommand = dtrCommandFactory.build({ ...submittedCommand, status: 'NOT_ACCEPTED' })
    const notAcceptedDutyToRefer = dutyToReferFactory
      .fromSubmission(notAcceptedCommand, localAuthority.name)
      .build({ crn, submission: { id } })

    // Given I have stubbed the API responses
    const caseData = await setupStubs(submittedDutyToRefer)

    // And I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // And I click the add outcome link
    await profileTrackerPage.clickLink('Add outcome')

    // Then I should see the duty to refer outcome form
    const dutyToReferPage = await DutyToReferPage.verifyOnPage(page, 'Add Duty to Refer (DTR) outcome details')
    await dutyToReferPage.shouldShowOutcomePage(caseData, submittedDutyToRefer)

    // When I complete the form and submit
    await dutyToReferPage.completeOutcomeForm(notAcceptedCommand)
    await dutyToReferApi.stubUpdateDutyToRefer(crn, id)
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, notAcceptedDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // And the API should have been called to update the duty to refer
    await dutyToReferPage.checkApiCalled(crn, notAcceptedCommand, 'update', id)

    // Then I should see the profile tracker page with the updated duty to refer details
    await ProfileTrackerPage.verifyOnPage(page, caseData)
    await profileTrackerPage.shouldShowDutyToRefer(notAcceptedDutyToRefer)
  })

  test('should allow the user to view the details of a duty to refer', async ({ page }) => {
    const localAuthority = referenceDataFactory.localAuthority().build()
    const notStartedDutyToRefer = dutyToReferFactory.notStarted().build({ crn })
    const submittedCommand = dtrCommandFactory.build({
      localAuthorityAreaId: localAuthority.id,
    })
    const submittedDutyToRefer = dutyToReferFactory.fromSubmission(submittedCommand, localAuthority.name).build({ crn })

    const acceptedCommand = dtrCommandFactory.build({ ...submittedCommand, status: 'ACCEPTED' })
    const acceptedDutyToRefer = dutyToReferFactory.fromSubmission(acceptedCommand, localAuthority.name).build({ crn })

    // Given I have stubbed the API responses
    const caseData = await setupStubs(notStartedDutyToRefer)
    await referenceDataApi.stubGetLocalAuthorities()

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
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(notStartedDutyToRefer)

    // Then I click the Add submission details button
    await dutyToReferDetailsPage.clickButton('Add submission details')

    // Then I should see the duty to refer guidance page
    const dutyToReferPage = await DutyToReferPage.verifyOnPage(page, 'Submit a duty to refer (DTR)')

    // Then I click the add submission details button
    await dutyToReferPage.clickButton('Add submission details')

    // Then I should see the duty to refer submission form
    await dutyToReferPage.shouldShowSubmissionForm(caseData)

    // When I submit the form with missing fields
    await dutyToReferPage.clickButton('Save and continue')

    // Then I should see errors
    await dutyToReferPage.shouldShowErrorMessagesForFields({
      submissionDate: 'Enter a submission date',
      localAuthorityAreaId: 'Select a local authority',
    })

    // When I complete the form and submit
    await dutyToReferPage.completeSubmissionForm(submittedCommand, localAuthority.name)
    await dutyToReferApi.stubSubmitDutyToRefer(crn)
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, submittedDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // And the API should have been called to submit the duty to refer
    await dutyToReferPage.checkApiCalled(crn, submittedCommand)

    // Then I should see the duty to refer details page with updated submission details
    await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(submittedDutyToRefer)

    // And I should see a success banner confirming submission details were added
    await dutyToReferDetailsPage.shouldShowBanner('Submission details added')

    // And the outcome details section should be empty
    await dutyToReferDetailsPage.shouldShowEmptyOutcomeDetails()

    // Then I click the Add outcome button
    await dutyToReferDetailsPage.clickButton('Add outcome')

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
    await outcomePage.completeOutcomeForm(acceptedCommand)
    await dutyToReferApi.stubUpdateDutyToRefer(crn, acceptedDutyToRefer.submission.id)
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, acceptedDutyToRefer)
    await outcomePage.clickButton('Save and continue')

    // And the API should have been called to update the duty to refer
    await outcomePage.checkApiCalled(crn, acceptedCommand, 'update', acceptedDutyToRefer.submission.id)

    // Then I should see the duty to refer details page with updated outcome details
    await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldShowOutcomeDetails(acceptedDutyToRefer)
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(acceptedDutyToRefer)

    // And I should see a success banner confirming outcome details were added
    await dutyToReferDetailsPage.shouldShowBanner('Outcome details added')
  })

  test('should allow the user to edit submission details', async ({ page }) => {
    const localAuthority = referenceDataFactory.localAuthority().build()
    const submittedCommand = dtrCommandFactory.build({
      localAuthorityAreaId: localAuthority.id,
      referenceNumber: 'REF123',
      submissionDate: '2025-06-15',
    })
    const submittedDutyToRefer = dutyToReferFactory.fromSubmission(submittedCommand, localAuthority.name).build({ crn })
    const submissionId = submittedDutyToRefer.submission.id
    const updatedCommand = dtrCommandFactory.build({
      ...submittedCommand,
      localAuthorityAreaId: localAuthority.id,
      referenceNumber: 'REF123-UPDATED',
      submissionDate: '2025-06-20',
    })
    const updatedDutyToRefer = dutyToReferFactory
      .fromSubmission(updatedCommand, localAuthority.name)
      .build({ crn, submission: { id: submissionId } })

    // Given I have stubbed the API responses
    const caseData = await setupStubs(submittedDutyToRefer)
    await referenceDataApi.stubGetLocalAuthorities()

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
    await dutyToReferPage.shouldShowSubmissionForm(caseData, 'edit')

    // When I submit the form with missing fields
    await dutyToReferPage.clickButton('Save and continue')

    // Then I should see errors
    await dutyToReferPage.shouldShowErrorMessagesForFields({
      submissionDate: 'Enter a submission date',
      localAuthorityAreaId: 'Select a local authority',
    })

    // When I complete the form and submit
    await dutyToReferPage.completeSubmissionForm(updatedCommand, localAuthority.name)
    await dutyToReferApi.stubUpdateDutyToRefer(crn, submissionId)
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, updatedDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // And the API should have been called to update the duty to refer
    await dutyToReferPage.checkApiCalled(crn, updatedCommand, 'update', submissionId)

    // Then I should see the duty to refer details page with updated submission details
    await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldShowSubmissionDetails(updatedDutyToRefer)

    // And I should see a success banner confirming submission details were updated
    await dutyToReferDetailsPage.shouldShowBanner('Submission details updated')
  })

  test('should allow the user to edit outcome details', async ({ page }) => {
    const localAuthority = referenceDataFactory.localAuthority().build()
    const acceptedCommand = dtrCommandFactory.build({
      status: 'ACCEPTED',
      localAuthorityAreaId: localAuthority.id,
      referenceNumber: 'REF123',
      submissionDate: '2025-06-15',
    })
    const acceptedDutyToRefer = dutyToReferFactory.fromSubmission(acceptedCommand, localAuthority.name).build({ crn })
    const submissionId = acceptedDutyToRefer.submission.id
    const updatedCommand = dtrCommandFactory.build({
      ...acceptedCommand,
      status: 'NOT_ACCEPTED',
    })
    const updatedDutyToRefer = dutyToReferFactory
      .fromSubmission(updatedCommand, localAuthority.name)
      .build({ crn, submission: { id: submissionId } })

    // Given I have stubbed the API responses
    const caseData = await setupStubs(acceptedDutyToRefer)

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
    await dutyToReferPage.shouldShowOutcomePage(caseData, acceptedDutyToRefer, 'edit')

    // When I submit the form with missing fields
    await dutyToReferPage.clickButton('Save and continue')

    // Then I should see errors
    await dutyToReferPage.shouldShowErrorMessagesForFields({
      outcomeStatus: 'Select duty to refer outcome',
    })

    // When I complete the form and submit
    await dutyToReferPage.completeOutcomeForm(updatedCommand)
    await dutyToReferApi.stubUpdateDutyToRefer(crn, submissionId)
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, updatedDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // And the API should have been called to update the duty to refer
    await dutyToReferPage.checkApiCalled(crn, updatedCommand, 'update', submissionId)

    // Then I should see the duty to refer details page with updated outcome details
    await DutyToReferDetailsPage.verifyOnPage(page, 'Duty to Refer (DTR)')
    await dutyToReferDetailsPage.shouldShowOutcomeDetails(updatedDutyToRefer)

    // And I should see a success banner confirming outcome details were updated
    await dutyToReferDetailsPage.shouldShowBanner('Outcome details updated')
  })
})
