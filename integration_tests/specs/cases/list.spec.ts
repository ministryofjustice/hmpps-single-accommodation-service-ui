import { test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import CasesListPage from '../../pages/cases/listPage'
import { caseFactory } from '../../../server/testutils/factories'

test.describe('List of cases', () => {
  test('Should list all cases for the user and allow filtering', async ({ page }) => {
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

    // AND the filters should be set to default values
    await casesListPage.shouldHaveFormValues({
      'Search by name, CRN or prison number': '',
      'Assigned to': 'you',
      RoSH: '',
    })

    // AND all the cases should be shown
    await casesListPage.shouldShowCases('25 people assigned to you', cases)

    // WHEN I filter the results
    await casesListPage.applyFilters({
      searchTerm: prisonNumber,
      assignedTo: 'Anyone',
      riskLevel: 'Very high',
    })

    // THEN the relevant cases are shown
    await casesListPage.shouldShowCases(
      `1 person matching '${prisonNumber}', assigned to anyone filtered by very high RoSH`,
      [filteredCase],
    )

    // AND the filters are populated with the selected values
    await casesListPage.shouldHaveFormValues({
      'Search by name, CRN or prison number': prisonNumber,
      'Assigned to': 'anyone',
      RoSH: 'VERY_HIGH',
    })
  })
})
