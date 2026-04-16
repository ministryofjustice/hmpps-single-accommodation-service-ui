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
    await casesListPage.shouldShowCases(cases, [
      'Person',
      'Current accommodation',
      'Next accommodation',
      'Status',
      'Actions',
    ])

    // TODO: Reinstate filtering tests when new case list endpoint accepts parameters
    // // WHEN I filter the results
    // await casesListPage.applyFilters({
    //   searchTerm: prisonNumber,
    //   assignedTo: 'Anyone',
    //   riskLevel: 'Very high',
    // })
    //
    // // THEN the relevant cases are shown
    // await casesListPage.shouldShowResultsSummary(`Showing 1 person`)
    // await casesListPage.shouldShowCases(
    //   [filteredCase],
    //   ['Person', 'Current accommodation', 'Next accommodation', 'Status', 'Actions'],
    // )
    //
    // // AND the filters are populated with the selected values
    // await casesListPage.verifyFilters({
    //   searchTerm: prisonNumber,
    //   assignedTo: 'anyone',
    //   riskLevel: 'VERY_HIGH',
    // })
    //
    // // AND the active filter tags are shown
    // await casesListPage.shouldShowFilterTags({
    //   Search: `'${prisonNumber}'`,
    //   'Assigned to': 'anyone',
    //   RoSH: 'Very high',
    // })
  })
})
