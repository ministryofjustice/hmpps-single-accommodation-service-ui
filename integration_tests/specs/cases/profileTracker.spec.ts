import { test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import { caseFactory } from '../../../server/testutils/factories'

test.describe('Profile Tracker Page', () => {
  test('Should display profile tracker for a specific case', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })
    const cases = [caseData]
    await casesApi.stubGetCases(cases)
    await casesApi.stubGetCaseByCrn(crn, caseData)
    await login(page)

    await page.getByRole('link', { name: caseData.name }).click()

    const profileTrackerPage = await ProfileTrackerPage.verifyOnPage(page, caseData)

    await profileTrackerPage.shouldShowCaseDetails(caseData)
  })
})
