import { test } from '@playwright/test'
import { login } from '../../testUtils'
import customListApi from '../../mockApis/customList'
import { caseFactory } from '../../../server/testutils/factories'
import CasesListPage from '../../pages/cases/listPage'
import CustomListPage from '../../pages/customList/customListPage'
import CreateListPage from '../../pages/customList/createListPage'
import ShowCaseListPage from '../../pages/customList/showCaseList'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import { stubProfilePage } from '../../helpers/profilePage'
import { stubCaseListPage } from '../../helpers/caseListPage'

test.describe('custom list', () => {
  test('should allow a user to create and view a custom list', async ({ page }) => {
    const cases = [caseFactory.build({ crn: 'X123456' }), caseFactory.build({ crn: 'X654321' })]
    await stubCaseListPage([])

    await customListApi.stubSubmitCustomList()

    // GIVEN a custom list does not already exist
    await customListApi.stubGetCustomListCrns([])

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
    await createListPage.checkUpdateListApiCalled(['X123456', 'X654321'])
    await customListApi.stubGetCustomListCases(cases, { peopleType: 'NFA_RISK' })
    // AND I should see the confirmation panel
    await createListPage.shouldShowPanel('CRNs added', '2 CRNs added')

    // WHEN I click the view list button
    await createListPage.clickButton('View list')

    // THEN I should see the custom case list page
    const showCaseListPage = await ShowCaseListPage.verifyOnPage(page)
    // AND I should see the change list link
    await showCaseListPage.shouldShowLink('Change list', '/custom-list/add-crns')
    // AND I should see the list of cases
    await showCaseListPage.shouldShowCases(cases, undefined, true)
    // todo should not show assigned to
  })
  test('should allow a user to navigate to a profile via the custom list', async ({ page }) => {
    const cases = [caseFactory.build({ crn: 'X123456' }), caseFactory.build({ crn: 'X654321' })]

    await customListApi.stubSubmitCustomList()
    await stubProfilePage({ crn: cases[0].crn, caseData: cases[0], accommodationSummaries: null })

    // GIVEN a custom list already exists
    await customListApi.stubGetCustomListCrns(['X123456', 'X654321'])
    await customListApi.stubGetCustomListCases(cases, { peopleType: 'NFA_RISK' })
    // WHEN I sign in
    await login(page)

    // THEN I should see the Case list
    const casesListPage = await CasesListPage.verifyOnPage(page)

    // WHEN I navigate to the custom list page
    await casesListPage.clickLink('Custom list')

    // THEN I should see the custom case list page
    const showCaseListPage = await ShowCaseListPage.verifyOnPage(page)

    // When I click a case within the list
    await showCaseListPage.clickCaseLink(cases[0])

    // Then I should see the profile tracker page for that case
    await ProfileTrackerPage.verifyOnProfileTrackerPage(page, cases[0], '/custom-list', 'Custom list')
  })
  test('should error when user does not input valid crn list', async ({ page }) => {
    // GIVEN a custom list does not already exist
    await customListApi.stubGetCustomListCrns([])

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

    // AND I click the submit button
    await createListPage.clickButton('Submit')
    // THEN should show error for the CRN input field
    await createListPage.shouldShowErrorMessagesForFields({ crnList: 'Enter 500 CRNs or fewer' })

    // WHEN I add invalid CRNs to the list
    await createListPage.completeInputByLabel('Add CRNs', 'CRN1')
    // AND I click the submit button
    await createListPage.clickButton('Submit')
    // THEN should show error for the CRN input field
    await createListPage.shouldShowErrorMessagesForFields({
      crnList: 'Enter a valid format for all CRNs. For example, D016821. CRN1 is not a valid CRN format',
    })
  })
  test('should show error when CRN does not exist', async ({ page }) => {
    // GIVEN a custom list does not already exist
    await customListApi.stubGetCustomListCrns([])
    await customListApi.stubDomainErrorCustomList('C123456')

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

    // GIVEN the CRN to be entered is valid but does not exist in the system
    // await customListApi.stubDomainErrorCustomList('C123456')

    // WHEN I add the CRN to the list
    await createListPage.completeInputByLabel('Add CRNs', 'C123456')
    // AND I click the submit button
    await createListPage.clickButton('Submit')
    // THEN should show error for the CRN input field
    await createListPage.shouldShowErrorMessagesForFields({ crnList: 'C123456 is not a recognised CRN' })
  })

  test('should allow a user to view an existing custom list and edit it', async ({ page }) => {
    const cases = [caseFactory.build({ crn: 'X123456' }), caseFactory.build({ crn: 'X654321' })]
    const newCases = [caseFactory.build({ crn: 'X123456' }), caseFactory.build({ crn: 'X987654' })]

    await customListApi.stubSubmitCustomList()

    // GIVEN a custom list already exists
    await customListApi.stubGetCustomListCrns(['X123456', 'X654321'])
    await customListApi.stubGetCustomListCases(cases, { peopleType: 'NFA_RISK' })

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
    await showCaseListPage.shouldShowCases(cases, undefined, true)

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
    await addCrnsPage.checkUpdateListApiCalled(['X123456', 'X987654'])
    // AND I should see the confirmation panel
    await addCrnsPage.shouldShowPanel('CRNs added', '2 CRNs added')
    await customListApi.stubGetCustomListCrns(['X123456', 'X987654'])
    await customListApi.stubGetCustomListCases(newCases, { peopleType: 'NFA_RISK' })

    // WHEN I click the view list button
    await addCrnsPage.clickButton('View list')

    // THEN I should see the custom case list page
    await ShowCaseListPage.verifyOnPage(page)
    // AND I should see the change list link
    await showCaseListPage.shouldShowLink('Change list', '/custom-list/add-crns')
    // AND I should see the list of cases
    await showCaseListPage.shouldShowCases(newCases, undefined, true)
  })
})
