import { test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import CasesListPage from '../../pages/cases/listPage'
import { caseFactory } from '../../../server/testutils/factories'

test.describe('List of cases', () => {
  test('Should list all cases', async ({ page }) => {
    const cases = caseFactory.buildList(5)
    await casesApi.stubGetCases(cases)
    await login(page)

    const casesListPage = await CasesListPage.verifyOnPage(page)

    await casesListPage.shouldShowCases(cases)
  })
})
