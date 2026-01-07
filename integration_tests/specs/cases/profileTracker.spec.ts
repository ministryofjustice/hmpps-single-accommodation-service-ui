import { test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import eligibilityApi from '../../mockApis/eligibility'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import {
  caseFactory,
  referralFactory,
  eligibilityFactory,
  serviceResultFactory,
} from '../../../server/testutils/factories'

test.describe('Profile Tracker Page', () => {
  test('Should display profile tracker for a specific case', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })
    const cases = [caseData]
    const eligibility = eligibilityFactory.build({
      cas1: serviceResultFactory.build(),
      cas2Hdc: serviceResultFactory.build(),
      cas3: serviceResultFactory.build(),
    })
    const referrals = referralFactory.buildList(3)
    await casesApi.stubGetCases(cases)
    await casesApi.stubGetCaseByCrn(crn, caseData)
    await eligibilityApi.stubGetEligibilityByCrn(crn, eligibility)
    await casesApi.stubGetReferralHistory(crn, referrals)
    await login(page)

    await page.getByRole('link', { name: caseData.name }).click()

    const profileTrackerPage = await ProfileTrackerPage.verifyOnPage(page, caseData)

    await profileTrackerPage.shouldShowCaseDetails(caseData)
    await profileTrackerPage.shouldShowEligibility(eligibility)
    await profileTrackerPage.shouldShowReferralHistory(referrals)
  })

  test.describe('accommodation cards', () => {
    const crn = 'X123456'

    test(`should render next and current cards for a confirmed case`, async ({ page }) => {
      const caseData = caseFactory.confirmed().build({ crn })
      await casesApi.stubGetCaseByCrn(crn, caseData)
      await eligibilityApi.stubGetEligibilityByCrn(crn)
      await casesApi.stubGetReferralHistory(crn)
      await login(page)

      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      await profileTrackerPage.shouldShowNextAccommodationCard(caseData.nextAccommodation)
      await profileTrackerPage.shouldShowCurrentAccommodationCard(caseData.currentAccommodation)
    })

    test(`should render next as alert and current as card for a NFA case`, async ({ page }) => {
      const caseData = caseFactory.noFixedAbodeNext().build({ crn })
      await casesApi.stubGetCaseByCrn(crn, caseData)
      await casesApi.stubGetReferralHistory(crn)
      await login(page)

      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      await profileTrackerPage.shouldShowNextAccommodationAlert(caseData.nextAccommodation)
      await profileTrackerPage.shouldShowCurrentAccommodationCard(caseData.currentAccommodation)
    })

    test(`should render only current alert for a currently NFA case`, async ({ page }) => {
      const caseData = caseFactory.noFixedAbodeCurrent().build({ crn })
      await casesApi.stubGetCaseByCrn(crn, caseData)
      await casesApi.stubGetReferralHistory(crn)
      await login(page)

      const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

      await profileTrackerPage.shouldShowCurrentAccommodationAlert(caseData.currentAccommodation)
    })
  })
})
