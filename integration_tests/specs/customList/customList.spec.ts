import { test } from '@playwright/test'
import { login } from '../../testUtils'
import customListApi from '../../mockApis/customList'
import userApi from '../../mockApis/user'
import { caseFactory } from '../../../server/testutils/factories'
import CasesListPage from '../../pages/cases/listPage'
import CustomListPage from '../../pages/customList/customListPage'
import CreateListPage from '../../pages/customList/createListPage'
import ShowCaseListPage from '../../pages/customList/showCaseList'

test.describe('custom list', () => {
  test('should allow a user to create and view a custom list', async ({ page }) => {
    const cases = [caseFactory.build({ crn: 'X123456' }), caseFactory.build({ crn: 'X654321' })]
    const teams = [{ code: 'team-one-code', name: 'Team One' }]

    await customListApi.stubSubmitCustomList()
    await userApi.stubGetTeams(teams)

    // GIVEN a custom list does not already exist
    await customListApi.stubGetCustomList([])

    // WHEN I sign in
    await login(page)

    // THEN I should see the Case list
    const casesListPage = await CasesListPage.verifyOnPage(page)

    // WHEN I click the custom list link
    await casesListPage.clickLink('Custom list')

    // THEN I should see the Custom list create page
    const customListPage = await CustomListPage.verifyOnPage(page)

    // WHEN I click the create list button
    await customListPage.clickButton('Create a list')

    // THEN I should see the create custom list page
    const createListPage = await CreateListPage.verifyOnPage(page)

    // WHEN I add CRNs to the list
    await createListPage.completeInputByLabel('Add CRNs', 'X123456,X654321')
    // AND I click the submit button
    await createListPage.clickButton('Submit')

    // THEN the API should be called with the correct CRNs
    await createListPage.checkApiCalled(['X123456', 'X654321'])
    // AND I should see the confirmation panel
    await createListPage.shouldShowPanel('CRNs added', '2 CRNs added')
    await customListApi.stubGetCustomList(cases)

    // WHEN I click the view list button
    await createListPage.clickButton('View list')

    // THEN I should see the custom case list page
    const showCaseListPage = await ShowCaseListPage.verifyOnPage(page)
    // AND I should see the change list link
    await showCaseListPage.shouldShowLink('Change list', '/custom-list/add-crns')
    // AND I should see the list of cases
    await showCaseListPage.shouldShowCases(cases)
  })

  test('should allow a user to view an existing custom list and edit it', async ({ page }) => {
    const cases = [caseFactory.build({ crn: 'X123456' }), caseFactory.build({ crn: 'X654321' })]
    const newCases = [caseFactory.build({ crn: 'X123456' }), caseFactory.build({ crn: 'X987654' })]
    const teams = [{ code: 'team-one-code', name: 'Team One' }]

    await customListApi.stubSubmitCustomList()
    await userApi.stubGetTeams(teams)

    // GIVEN a custom list already exists
    await customListApi.stubGetCustomList(cases)

    // WHEN I sign in
    await login(page)

    // THEN I should see the Case list
    const casesListPage = await CasesListPage.verifyOnPage(page)

    // WHEN I navigate to the custom list page
    await casesListPage.clickLink('Custom list')

    // THEN I should see the custom case list page
    const showCaseListPage = await ShowCaseListPage.verifyOnPage(page)
    // AND I should see the change list link
    await showCaseListPage.shouldShowLink('Change list', '/custom-list/add-crns')
    // AND I should see the list of cases
    await showCaseListPage.shouldShowCases(cases)

    // When I click the change link
    await showCaseListPage.clickLink('Change list')

    // THEN I should see the add crns custom list page
    const addCrnsPage = await CreateListPage.verifyOnPage(page)
    // AND I should see the pre-populated CRNs in the input field
    await addCrnsPage.verifyTextInput('Add CRNs', 'X123456,X654321')

    // When I change a CRN on the list
    await addCrnsPage.completeInputByLabel('Add CRNs', 'X123456,X987654')
    // AND I click the submit button
    await addCrnsPage.clickButton('Submit')

    // THEN the API should be called with the correct CRNs
    await addCrnsPage.checkApiCalled(['X123456', 'X987654'])
    // AND I should see the confirmation panel
    await addCrnsPage.shouldShowPanel('CRNs added', '2 CRNs added')
    await customListApi.stubGetCustomList(newCases)

    // WHEN I click the view list button
    await addCrnsPage.clickButton('View list')

    // THEN I should see the custom case list page
    await ShowCaseListPage.verifyOnPage(page)
    // AND I should see the change list link
    await showCaseListPage.shouldShowLink('Change list', '/custom-list/add-crns')
    // AND I should see the list of cases
    await showCaseListPage.shouldShowCases(newCases)
  })
})
