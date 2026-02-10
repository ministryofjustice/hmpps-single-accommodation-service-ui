import { expect, test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import CasesListPage from '../../pages/cases/listPage'
import { caseFactory } from '../../../server/testutils/factories'

test.describe('List of cases', () => {
  test('Should list all cases and allow filtering', async ({ page }) => {
    // GIVEN there are cases to show
    const cases = [...Array(25)].map(() => caseFactory.confirmed().build())
    await casesApi.stubGetCases(cases)

    const filteredCase = cases.find(c => c.riskLevel === 'VERY_HIGH')
    const { prisonNumber } = filteredCase
    await casesApi.stubGetCases([filteredCase], { searchTerm: prisonNumber, riskLevel: 'VERY_HIGH' })

    // WHEN I sign in
    await login(page)

    // THEN I should see the Case List
    const casesListPage = await CasesListPage.verifyOnPage(page)

    // AND all the cases should be shown
    await casesListPage.shouldShowCases(cases)

    // WHEN I filter the results
    await page.getByLabel('Search by name, CRN or prison number').fill(prisonNumber)
    await page.getByLabel('RoSH').selectOption('Very high')
    await page.getByRole('button', { name: 'Apply filters' }).click()

    // THEN the relevant cases are shown
    await casesListPage.shouldShowCases([filteredCase])

    // AND the filters are populated with the selected values
    await expect(page.getByLabel('Search by name, CRN or prison number')).toHaveValue(prisonNumber)
    await expect(page.getByLabel('RoSH')).toHaveValue('VERY_HIGH')
  })
})
