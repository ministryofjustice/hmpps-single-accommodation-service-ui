import { test } from '../test'
import { signIn } from '../steps/signIn'
import CaseDetailsPage from '../pages/caseDetailsPage'

test.skip('CAS3 status is Not eligible', async ({ page, users: { probation: probationUser } }) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I click on the first result
  const firstCaseLink = page
    .getByRole('row')
    .nth(1)
    .getByRole('link')

  await firstCaseLink.click()

  // WHEN I view the case details page
  const caseDetailsPage = new CaseDetailsPage(page)

  // THEN I should see the CAS3 status as Not eligible
  await caseDetailsPage.expectCas3Status('Not eligible')
})
