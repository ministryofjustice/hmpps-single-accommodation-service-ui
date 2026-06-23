import { test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import CasesListPage from '../../pages/cases/listPage'
import { caseFactory } from '../../../server/testutils/factories'
import { formatRiskLevel } from '../../../server/utils/cases'
import LaoAccessPage from '../../pages/cases/laoAccessPage'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import { stubCaseListPage } from '../../helpers/caseListPage'
import { stubProfilePage } from '../../helpers/profilePage'

test.describe('List of cases', () => {
  test('Should list all cases for the user and allow filtering', async ({ page }) => {
    const cases = [...Array(25)].map(() => caseFactory.confirmed().build())
    const teams = [
      { code: 'team-one-code', name: 'Team One' },
      { code: 'team-two-code', name: 'Team Two' },
    ]
    await stubCaseListPage(cases, teams)

    const filteredCase = cases[0]
    const { prisonNumber, riskLevel } = filteredCase
    await casesApi.stubGetCases([filteredCase], { searchTerm: prisonNumber, riskLevel })

    await stubProfilePage({ crn: filteredCase.crn, caseData: filteredCase })

    // WHEN I sign in
    await login(page)

    // THEN I should see the Case list
    const casesListPage = await CasesListPage.verifyOnPage(page)

    // AND the filters should be set to default values
    await casesListPage.verifyFilters({
      searchTerm: '',
      teamCode: '',
      riskLevel: '',
    })

    // AND all the cases should be shown
    await casesListPage.shouldShowResultsSummary('25 people')
    await casesListPage.shouldShowCases(cases, [])

    // WHEN I filter the results
    await casesListPage.applyFilters({
      searchTerm: prisonNumber,
      riskLevel: formatRiskLevel(riskLevel),
      teamName: 'Team One',
    })

    // THEN the relevant cases are shown
    await casesListPage.shouldShowResultsSummary(`Showing 1 person`)
    await casesListPage.shouldShowCases([filteredCase], [], true)

    // AND the filters are populated with the selected values
    await casesListPage.verifyFilters({
      searchTerm: prisonNumber,
      teamCode: 'team-one-code',
      riskLevel,
    })

    // AND the active filter tags are shown
    await casesListPage.shouldShowFilterTags({
      Search: `‘${prisonNumber}’`,
      RoSH: formatRiskLevel(riskLevel),
      'Assigned to': 'Team One',
    })

    // WHEN I click on a case
    await casesListPage.clickLink(filteredCase.name)

    // THEN I should see the profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.verifyOnPage(page, filteredCase)

    // WHEN I click on the Case list link
    await profileTrackerPage.clickLink('Case list')

    // THEN I should see the Case list page again
    await CasesListPage.verifyOnPage(page)

    // AND the active filter tags are shown
    await casesListPage.shouldShowFilterTags({
      Search: `‘${prisonNumber}’`,
      RoSH: formatRiskLevel(riskLevel),
      'Assigned to': 'Team One',
    })
  })

  test('should show LAO cases', async ({ page }) => {
    // GIVEN there are LAO cases to show
    const cases = [caseFactory.build(), caseFactory.build({ limitedAccess: true }), caseFactory.limitedAccess().build()]
    await casesApi.stubGetCases(cases)
    await casesApi.stubGetCaseByCrn(cases[2].crn, cases[2])

    // WHEN I sign in
    await login(page)

    // THEN I should see the Case list
    const casesListPage = await CasesListPage.verifyOnPage(page)
    await casesListPage.shouldShowCases(cases, [])

    // WHEN I click on a Limited access offender link
    await casesListPage.clickLink('Limited access offender')

    // THEN I should see the LAO access page
    const laoAccessPage = await LaoAccessPage.verifyOnPage(page, cases[2])

    // AND it should have content
    await laoAccessPage.shouldHaveContent()
  })
})
