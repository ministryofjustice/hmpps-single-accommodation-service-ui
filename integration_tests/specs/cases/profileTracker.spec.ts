import { test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import { caseFactory, referralFactory } from '../../../server/testutils/factories'

test.describe('Profile Tracker Page', () => {
  test('Should display profile tracker for a specific case', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })
    const cases = [caseData]
    const referrals = referralFactory.buildList(3)
    await casesApi.stubGetCases(cases)
    await casesApi.stubGetCaseByCrn(crn, caseData)
    await casesApi.stubGetReferralHistory(crn, referrals)
    await login(page)

    await page.getByRole('link', { name: caseData.name }).click()

    const profileTrackerPage = await ProfileTrackerPage.verifyOnPage(page, caseData)

    await profileTrackerPage.shouldShowCaseDetails(caseData)
    await profileTrackerPage.shouldShowReferralHistory(referrals)
  })
})
