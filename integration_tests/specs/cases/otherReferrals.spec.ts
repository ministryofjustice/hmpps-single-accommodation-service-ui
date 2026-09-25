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
import OtherReferralsDetailsPage from '../../pages/cases/otherReferralsDetailsPage'

const crn = 'X123456'
const setupStubs = async () => {
  const referral = otherAccommodationReferralFactory.build({ crn })
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
  await otherReferralsApi.stubSubmitOtherReferral(crn)
  await otherReferralsApi.stubGetOtherReferralBySubmissionId(referral)
  await otherReferralsApi.stubListOtherReferral(crn, [referral])

  return { caseData, referral }
}

test.describe('other referrals', () => {
  test('should allow user to submit new other referral', async ({ page }) => {
    // Given I have stubbed the API responses
    const { caseData, referral } = await setupStubs()

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

  test('should allow user see referrals on the tracker page and view their details', async ({ page }) => {
    // Given I have stubbed the API responses
    const { caseData, referral } = await setupStubs()
    // And I am logged in
    await login(page)

    // When I visit the person tracker page
    const trackerPage = await ProfileTrackerPage.visit(page, caseData)

    // Then I see the external referral cards
    await trackerPage.shouldShowExternalReferralCards([referral])

    // When I select 'view details' on a referral card
    await trackerPage.viewReferralDetails()

    // Then I am on the referral details page
    const detailsPage = await OtherReferralsDetailsPage.verifyOnPage(page, referral)

    // And I should see the referral details
    await detailsPage.shouldShowSubmissionDetails()

    // When I click the change link
    // TODO: continue
  })
})
