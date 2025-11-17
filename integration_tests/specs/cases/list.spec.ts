import { expect, test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import CasesListPage from '../../pages/cases/listPage'

test.describe('List of cases', () => {
  test('Should list all cases', async ({ page }) => {
    await casesApi.stubGetCases()
    await login(page)

    const casesListPage = await CasesListPage.verifyOnPage(page)

    await expect(casesListPage.casesList).toContainText('John Foobar, X123456')
  })
})
