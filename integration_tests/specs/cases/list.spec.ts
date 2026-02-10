import { test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import CasesListPage from '../../pages/cases/listPage'
import { caseFactory } from '../../../server/testutils/factories'

test.describe('List of cases', () => {
  test('Should list all cases and allow filtering', async ({ page }) => {
    // GIVEN there are cases to show
    const cases = [...Array(25)].map(() => caseFactory.confirmed().build())
    await casesApi.stubGetCases(cases)

    const filteredCases = cases.filter(c => c.riskLevel === 'VERY_HIGH')
    await casesApi.stubGetCases(filteredCases, { riskLevel: 'VERY_HIGH' })

    // WHEN I sign in
    await login(page)

    // THEN I should see the Case List
    const casesListPage = await CasesListPage.verifyOnPage(page)

    // AND all the cases should be shown
    await casesListPage.shouldShowCases(cases)

    // WHEN I filter the results by Risk of Serious Harm
    await page.getByLabel('RoSH').selectOption('Very high')
    await page.getByRole('button', { name: 'Apply filters' }).click()

    // THEN the relevant cases are shown
    await casesListPage.shouldShowCases(filteredCases)
  })
})
