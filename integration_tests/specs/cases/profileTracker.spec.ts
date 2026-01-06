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
})
