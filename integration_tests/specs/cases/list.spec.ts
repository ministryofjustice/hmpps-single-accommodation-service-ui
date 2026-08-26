import { test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import CasesListPage from '../../pages/cases/listPage'
import { accommodationSummaryFactory, addressFactory, caseFactory } from '../../../server/testutils/factories'
import LaoAccessPage from '../../pages/cases/laoAccessPage'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import { stubCaseListPage } from '../../helpers/caseListPage'
import { stubProfilePage } from '../../helpers/profilePage'
import { formatCurrentAccommodation } from '../../../server/utils/cases'
import config from '../../../server/config'

test.describe('List of cases', () => {
  const teams = [
    { code: 'team-one-code', name: 'Team One' },
    { code: 'team-two-code', name: 'Team Two' },
  ]

  test('Should list all cases for the user and allow filtering', async ({ page }) => {
    const cases = [...Array(25)].map(() => caseFactory.build())
    await stubCaseListPage(cases, teams)

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
  })

  test.describe('Filtering', () => {
    test.skip(!config.flags.caseListV2_currentAccommodationFilter, 'Feature flag disabled')

    let cases: ReturnType<typeof caseFactory.build>[]

    test.beforeEach(async () => {
      cases = [...Array(25)].map(() => caseFactory.build())
      await stubCaseListPage(cases, teams)
    })

    test('team code only', async ({ page }) => {
      const filteredCase = cases[0]
      const teamCode = teams[0].code
      await casesApi.stubGetCases([filteredCase], {
        teamCode,
      })

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
        currentAccommodation: '',
      })

      // WHEN I filter the results
      await casesListPage.applyFilters({
        teamName: 'Team One',
      })

      // THEN the relevant cases are shown
      await casesListPage.shouldShowResultsSummary(`Showing 1 person`)
      await casesListPage.shouldShowCases([filteredCase], [], true)

      // AND the filters are populated with the selected values
      await casesListPage.verifyFilters({
        searchTerm: '',
        teamCode,
        riskLevel: '',
        currentAccommodation: '',
      })

      // AND the active filter tags are shown
      await casesListPage.shouldShowFilterTags({
        'Assigned to': 'Team One',
      })
    })

    test('current accommodation only', async ({ page }) => {
      const accommodationSummary = accommodationSummaryFactory.build({
        startDate: undefined,
        endDate: undefined,
        status: { code: 'M', description: 'Main' },
        type: { code: 'A02', description: 'Approved Premises' },
        address: addressFactory.minimal().build({
          postTown: 'London',
          postcode: 'SW1A 1AA',
        }),
      })

      const filteredCase = cases[0]
      filteredCase.accommodationSummaries = { currentAccommodation: accommodationSummary }
      const currentAccommodation = 'CAS1'
      await casesApi.stubGetCases([filteredCase], {
        currentAccommodation,
      })

      await stubProfilePage({ crn: filteredCase.crn, caseData: filteredCase })

      // WHEN I sign in
      await login(page)

      // THEN I should see the Case list
      const casesListPage = await CasesListPage.verifyOnPage(page)

      // WHEN I filter the results
      await casesListPage.applyFilters({
        currentAccommodation,
      })

      // THEN the relevant cases are shown
      await casesListPage.shouldShowResultsSummary(`Showing 1 person`)
      await casesListPage.shouldShowCases([filteredCase], [])

      // AND the filters are populated with the selected values
      await casesListPage.verifyFilters({
        searchTerm: '',
        teamCode: '',
        riskLevel: '',
        currentAccommodation,
      })

      // AND the active filter tags are shown
      await casesListPage.shouldShowFilterTags({
        'Current accommodation': formatCurrentAccommodation(currentAccommodation),
      })
    })

    test('team code, risk and current accommodation', async ({ page }) => {
      const accommodationSummary = accommodationSummaryFactory.build({
        startDate: undefined,
        endDate: undefined,
        status: { code: 'M', description: 'Main' },
        type: { code: 'A17', description: 'CAS3 accommodation' },
        address: addressFactory.minimal().build({
          postTown: 'London',
          postcode: 'SW1A 1AA',
        }),
      })

      const filteredCase = cases[0]
      filteredCase.accommodationSummaries = { currentAccommodation: accommodationSummary }
      const currentAccommodation = 'CAS3'
      const teamCode = teams[0].code
      const riskLevel = 'HIGH'
      await casesApi.stubGetCases([filteredCase], {
        teamCode,
        riskLevel,
        currentAccommodation,
      })

      await stubProfilePage({ crn: filteredCase.crn, caseData: filteredCase })

      // WHEN I sign in
      await login(page)

      // THEN I should see the Case list
      const casesListPage = await CasesListPage.verifyOnPage(page)

      // WHEN I filter the results
      await casesListPage.applyFilters({
        teamName: 'Team One',
        riskLevel: 'High',
        currentAccommodation,
      })

      // THEN the relevant cases are shown
      await casesListPage.shouldShowResultsSummary(`Showing 1 person`)
      await casesListPage.shouldShowCases([filteredCase], [], true)

      // AND the filters are populated with the selected values
      await casesListPage.verifyFilters({
        searchTerm: '',
        teamCode,
        riskLevel,
        currentAccommodation,
      })

      // AND the active filter tags are shown
      await casesListPage.shouldShowFilterTags({
        'Assigned to': 'Team One',
        RoSH: 'High',
        'Current accommodation': formatCurrentAccommodation(currentAccommodation),
      })

      // WHEN I click on a case
      await casesListPage.clickCaseLink(filteredCase)

      // THEN I should see the profile tracker page
      const profileTrackerPage = await ProfileTrackerPage.verifyOnPage(page, filteredCase)

      // WHEN I click on the Case list link
      await profileTrackerPage.clickLink('Case list')

      // THEN I should see the Case list page again
      await CasesListPage.verifyOnPage(page)

      // AND the active filter tags are shown
      await casesListPage.shouldShowFilterTags({
        'Assigned to': 'Team One',
        RoSH: 'High',
        'Current accommodation': formatCurrentAccommodation(currentAccommodation),
      })
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
    await casesListPage.clickCaseLink(cases[2])

    // THEN I should see the LAO access page
    const laoAccessPage = await LaoAccessPage.verifyOnPage(page, cases[2])

    // AND it should have content
    await laoAccessPage.shouldHaveContent()
  })
})
