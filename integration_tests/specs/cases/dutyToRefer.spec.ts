import { test, expect } from '@playwright/test'
import casesApi from '../../mockApis/cases'
import proposedAddressesApi from '../../mockApis/proposedAddresses'
import dutyToReferApi from '../../mockApis/dutyToRefer'
import eligibilityApi from '../../mockApis/eligibility'
import { caseFactory, dutyToReferFactory, dutyToReferV2Factory } from '../../../server/testutils/factories'
import { login } from '../../testUtils'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import DutyToReferPage from '../../pages/cases/dutyToReferPage'

test.describe('duty to refer', () => {
  test('should allow user to submit a duty to refer and add outcome', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })
    const dutyToRefer = dutyToReferFactory.build({ crn })
    const notStartedDutyToRefer = dutyToReferV2Factory.notStarted().build({ crn })

    // Given I have stubbed the API responses
    await casesApi.stubGetCases([caseData])
    await casesApi.stubGetCaseByCrn(crn, caseData)
    await dutyToReferApi.stubGetAllDutyToReferByCrn(crn, [dutyToRefer])
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, notStartedDutyToRefer)
    await eligibilityApi.stubGetEligibilityByCrn(crn, undefined)
    await casesApi.stubGetReferralHistory(crn, [])
    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, [])

    // And I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // And I click the add submission details link
    await profileTrackerPage.clickLink('Add submission details')

    // Then I should see the duty to refer guidance page
    const dutyToReferPage = await DutyToReferPage.verifyOnPage(page)

    // Then I click the add submission details button
    await dutyToReferPage.clickButton('Add submission details')

    // Then I should see the duty to refer submission form
    await dutyToReferPage.shouldShowSubmissionForm(notStartedDutyToRefer)

    // When I complete the form and submit
    await dutyToReferPage.completeSubmissionForm(notStartedDutyToRefer)
    await dutyToReferPage.clickButton('Submit')

    // And the API should have been called to submit the duty to refer
    await dutyToReferPage.checkApiCalled(crn, notStartedDutyToRefer)

    // Then I should see the profile tracker page with the new duty to refer details
    await ProfileTrackerPage.verifyOnPage(page)
    await profileTrackerPage.shouldShowDutyToRefer(notStartedDutyToRefer)

    // When I click the add outcome link
    await profileTrackerPage.clickLink('Add outcome')

    // Then I should see the duty to refer outcome form
    await dutyToReferPage.shouldShowOutcomePage()

    // When I complete the form and submit
    const acceptedDutyToRefer = dutyToReferV2Factory.accepted().build({ crn })
    await dutyToReferPage.completeOutcomeForm(acceptedDutyToRefer)
    await dutyToReferPage.clickButton('Save and continue')

    // And the API should have been called to update the duty to refer
    await dutyToReferPage.checkApiCalled(crn, acceptedDutyToRefer)

    // Then I should see the profile tracker page with the updated duty to refer details
    await ProfileTrackerPage.verifyOnPage(page)
    await profileTrackerPage.shouldShowDutyToRefer(acceptedDutyToRefer)
  })
})
