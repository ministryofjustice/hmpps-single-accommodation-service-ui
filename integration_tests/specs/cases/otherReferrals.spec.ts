import { test } from '@playwright/test'
import { caseFactory, eligibilityFactory, otherAccommodationReferralFactory } from '../../../server/testutils/factories'
import casesApi from '../../mockApis/cases'
import proposedAddressesApi from '../../mockApis/proposedAddresses'
import accommodationApi from '../../mockApis/accommodation'
import otherReferralsApi from '../../mockApis/otherReferrals'
import userApi from '../../mockApis/user'
import { login } from '../../testUtils'
import OtherReferralsSubmissionPage from '../../pages/cases/otherReferralsSubmissionPage'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import eligibilityApi from '../../mockApis/eligibility'
import referenceDataApi from '../../mockApis/referenceData'

const crn = 'X123456'
const setupStubs = async () => {
  const caseData = caseFactory.build({ crn })
  await casesApi.stubGetCases([caseData])
  await casesApi.stubGetCaseByCrn(crn, caseData)
  await eligibilityApi.stubGetEligibilityByCrn(crn, eligibilityFactory.build({ crn }))
  await casesApi.stubGetReferralHistory(crn, [])
  await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, [])
  await accommodationApi.stubGetAccommodationHistory(crn, [])
  await referenceDataApi.stubGetLocalAuthorities()
  await accommodationApi.stubGetAccommodationSummary(crn, undefined)
  await userApi.stubGetTeams()
  await userApi.stubGetTeams()
  await otherReferralsApi.stubSubmitOtherReferral(crn)

  return { caseData }
}

test.describe('other referrals', () => {
  test('should allow user to submit new other referral', async ({ page }) => {
    const referral = otherAccommodationReferralFactory.build({ crn })

    // Given I have stubbed the API responses
    const { caseData } = await setupStubs()

    // And I am logged in
    await login(page)

    // When I visit the other referral creation page
    const submissionPage = await OtherReferralsSubmissionPage.visit(page, caseData)

    // Then I should see the case details summary
    await submissionPage.shouldShowCaseSummary(caseData)

    // When I submit the empty form
    await submissionPage.clickButton('Save and continue')

    // Then I should see page errors
    await submissionPage.shouldShowErrorMessagesForFields(
      { organisationName: 'Enter an organisation name', submissionDate: 'Enter a date' },
      ['submissionDate'],
    )

    // When I complete the form and submit
    await submissionPage.completeSubmissionForm(referral)
    await submissionPage.clickButton('Save and continue')

    // Then I see the confirmation banner
    const trackerPage = await ProfileTrackerPage.verifyOnPage(page, caseData)
    await trackerPage.shouldShowBanner('Success', 'Referral details added')
  })
})
