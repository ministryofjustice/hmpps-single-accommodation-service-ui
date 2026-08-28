import { test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import CasesListPage from '../../pages/cases/listPage'
import { caseFactory } from '../../../server/testutils/factories'
import SearchPage from '../../pages/cases/searchPage'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import { stubCaseListPage } from '../../helpers/caseListPage'
import { stubProfilePage } from '../../helpers/profilePage'

test.describe('Find a person', () => {
  test('should search for a case and navigate to profile', async ({ page }) => {
    const cases = [...Array(25)].map(() => caseFactory.build())
    await stubCaseListPage(cases)
    const searchCase = cases[0]

    await casesApi.stubSearchByCrn(searchCase)
    await casesApi.stubGetCases(cases)

    await stubProfilePage({ crn: searchCase.crn, caseData: searchCase })

    // WHEN I sign in
    await login(page)

    // THEN I should see the Case list
    const casesListPage = await CasesListPage.verifyOnPage(page)

    // AND all the cases should be shown
    await casesListPage.shouldShowResultsSummary('25 people')
    await casesListPage.shouldShowCases(cases, [])

    // WHEN I navigate to the search page
    await casesListPage.clickLink('Search')

    // THEN I should see the search page
    const searchPage = await SearchPage.verifyOnPage(page)

    // WHEN I click the search button without entering any search term
    await searchPage.clickButton('Search')

    // THEN I should see an error message
    await searchPage.shouldShowErrorMessagesForFields({ searchTerm: 'Enter a CRN' })

    // WHEN I enter a valid CRN and click the search button
    await searchPage.completeInputByLabel('Find a person', searchCase.crn)
    await searchPage.clickButton('Search')

    // THEN I should see the relevant case shown
    await searchPage.shouldShowResultsSummary(`Result for ‘${searchCase.crn}’`)
    await searchPage.shouldShowSearchResults(searchCase, [])

    // WHEN I click on the case
    await searchPage.clickCaseLink(searchCase)

    // THEN I should see the profile tracker page
    await ProfileTrackerPage.verifyOnPage(page, searchCase)
  })

  test('should show no results message when case not found', async ({ page }) => {
    const cases = [...Array(25)].map(() => caseFactory.build())
    await stubCaseListPage(cases)
    const searchTerm = 'X111111'

    // WHEN I sign in
    await login(page)

    // THEN I should see the Case list
    const casesListPage = await CasesListPage.verifyOnPage(page)

    // WHEN I navigate to the search page
    await casesListPage.clickLink('Search')

    // THEN I should see the search page
    const searchPage = await SearchPage.verifyOnPage(page)

    // WHEN I enter a CRN that returns no results and click the search button
    await searchPage.completeInputByLabel('Find a person', searchTerm)
    await searchPage.clickButton('Search')

    // THEN I should see no results message
    await searchPage.shouldShowResultsSummary(`0 results for ‘${searchTerm}’`)
  })
})
