import { test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import CasesListPage from '../../pages/cases/listPage'
import { caseFactory } from '../../../server/testutils/factories'
import { formatRiskLevel } from '../../../server/utils/cases'

test.describe('List of cases', () => {
  test('Should list all cases for the user and allow filtering', async ({ page }) => {
    // GIVEN there are cases to show
    const cases = [...Array(25)].map(() => caseFactory.confirmed().build())
    await casesApi.stubGetCases(cases)

    const filteredCase = cases[0]
    const { prisonNumber, riskLevel } = filteredCase
    await casesApi.stubGetCases([filteredCase], { searchTerm: prisonNumber, riskLevel })

    // WHEN I sign in
    await login(page)

    // THEN I should see the Case list
    const casesListPage = await CasesListPage.verifyOnPage(page)

    // AND the filters should be set to default values
    await casesListPage.verifyFilters({
      searchTerm: '',
      assignedTo: 'you',
      riskLevel: '',
    })

    // AND all the cases should be shown
    await casesListPage.shouldShowResultsSummary('25 people')
    await casesListPage.shouldShowCases(cases, ['Person'])

    // WHEN I filter the results
    await casesListPage.applyFilters({
      searchTerm: prisonNumber,
      riskLevel: formatRiskLevel(riskLevel),
    })

    // THEN the relevant cases are shown
    await casesListPage.shouldShowResultsSummary(`Showing 1 person`)
    await casesListPage.shouldShowCases([filteredCase], ['Person'])

    // AND the filters are populated with the selected values
    await casesListPage.verifyFilters({
      searchTerm: prisonNumber,
      assignedTo: 'you',
      riskLevel,
    })

    // AND the active filter tags are shown
    await casesListPage.shouldShowFilterTags({
      Search: `'${prisonNumber}'`,
      RoSH: formatRiskLevel(riskLevel),
    })
  })
})
