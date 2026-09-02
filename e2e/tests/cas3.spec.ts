import { test } from '../test'
import { signIn } from '../steps/signIn'
import { getCaseLink } from '../steps/getCaseLink'
import CaseDetailsPage from '../pages/caseDetailsPage'

test.skip('CAS3 status is Not eligible', async ({
  page,
  users: { probation: probationUser },
  cases: { BASE_CASE },
}) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I navigate to the base test case
  const { caseLink } = await getCaseLink(page, BASE_CASE)
  await caseLink.click()

  // WHEN I view the case details page
  const caseDetailsPage = new CaseDetailsPage(page)

  // THEN I should see the CAS3 status as Not eligible
  await caseDetailsPage.expectCas3Status('Not eligible')
})
