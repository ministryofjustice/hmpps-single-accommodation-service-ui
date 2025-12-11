import { test } from '@playwright/test'
import { login } from '../../testUtils'
import casesApi from '../../mockApis/cases'
import CasesListPage from '../../pages/cases/listPage'
import { accommodationFactory, caseFactory } from '../../../server/testutils/factories'

test.describe('List of cases', () => {
  test('Should list all cases', async ({ page }) => {
    const cases = [
      caseFactory.build({ currentAccommodation: accommodationFactory.prison().build() }),
      caseFactory.build({ currentAccommodation: accommodationFactory.privateAddress().build() }),
      caseFactory.build({ currentAccommodation: accommodationFactory.cas('cas1').build() }),
      caseFactory.build({ currentAccommodation: accommodationFactory.cas('cas2').build() }),
      caseFactory.build({ currentAccommodation: accommodationFactory.cas('cas2v2').build() }),
      caseFactory.build({ currentAccommodation: accommodationFactory.cas('cas3').build() }),
    ]
    await casesApi.stubGetCases(cases)
    await login(page)

    const casesListPage = await CasesListPage.verifyOnPage(page)

    await casesListPage.shouldShowCases(cases)
  })
})
