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
    const submissionCommand = dtrCommandFactory.build({
      localAuthorityAreaId: localAuthority.id,
    })
    const submissionDutyToRefer = dutyToReferFactory.submitted().build({
      crn,
      status: submissionCommand.status,
      submission: {
        ...submissionCommand,
        localAuthority: { localAuthorityAreaId: localAuthority.id, localAuthorityAreaName: localAuthority.name },
      },
    })

    const acceptedCommand = dtrCommandFactory.build({ ...submissionCommand, status: 'ACCEPTED' })
    const acceptedDutyToRefer = dutyToReferFactory.accepted().build({
      crn,
      status: acceptedCommand.status,
      submission: {
        ...acceptedCommand,
        localAuthority: { localAuthorityAreaId: localAuthority.id, localAuthorityAreaName: localAuthority.name },
      },
    })

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
    await dutyToReferPage.completeSubmissionForm(submissionDutyToRefer, localAuthority.name)
    await dutyToReferApi.stubSubmitDutyToRefer(crn)
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, submissionDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // And the API should have been called to submit the duty to refer
    await dutyToReferPage.checkApiCalled(crn, submissionCommand)

    // Then I should see the profile tracker page with the new duty to refer details
    await ProfileTrackerPage.verifyOnPage(page, caseData)
    await profileTrackerPage.shouldShowDutyToRefer(submissionDutyToRefer)

    // When I click the add outcome link
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, acceptedDutyToRefer)
    await profileTrackerPage.clickLink('Add outcome')

    // Then I should see the duty to refer outcome form
    const outcomePage = await DutyToReferPage.verifyOnPage(page, 'Add Duty to Refer (DTR) outcome details')
    await outcomePage.shouldShowOutcomePage()

    // When I submit the form with missing fields
    await outcomePage.clickButton('Save and continue')

    // Then I should see errors
    await outcomePage.shouldShowErrorMessagesForFields({
      outcomeStatus: 'Select duty to refer outcome',
    })

    // When I complete the form and submit
    await outcomePage.completeOutcomeForm(acceptedDutyToRefer)
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
    const submissionCommand = dtrCommandFactory.build({ status: 'SUBMITTED', localAuthorityAreaId: localAuthority.id })
    const submittedDutyToRefer = dutyToReferFactory.submitted().build({
      crn,
      submission: {
        ...submissionCommand,
        id,
        localAuthority: { localAuthorityAreaId: localAuthority.id, localAuthorityAreaName: localAuthority.name },
      },
    })

    const notAcceptedCommand = dtrCommandFactory.build({ ...submissionCommand, status: 'NOT_ACCEPTED' })
    const notAcceptedDutyToRefer = dutyToReferFactory.notAccepted().build({
      crn,
      submission: {
        ...notAcceptedCommand,
        id,
        localAuthority: { localAuthorityAreaId: localAuthority.id, localAuthorityAreaName: localAuthority.name },
      },
    })

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
    await dutyToReferPage.shouldShowOutcomePage()

    // When I complete the form and submit
    await dutyToReferPage.completeOutcomeForm(notAcceptedDutyToRefer)
    await dutyToReferApi.stubUpdateDutyToRefer(crn, id)
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, notAcceptedDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // And the API should have been called to update the duty to refer
    await dutyToReferPage.checkApiCalled(crn, notAcceptedCommand, 'update', id)

    // Then I should see the profile tracker page with the updated duty to refer details
    await ProfileTrackerPage.verifyOnPage(page, caseData)
    await profileTrackerPage.shouldShowDutyToRefer(notAcceptedDutyToRefer)
  })
})
