import { test } from '../test'
import { signIn } from '../steps/signIn'
import { getCaseLink } from '../steps/getCaseLink'
import CaseDetailsPage from '../pages/caseDetailsPage'

// TODO: Re-enable when a known CRN with no proposed addresses is available in Dev.
test.skip('Proposed addresses empty state is displayed', async ({
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

  // THEN I should see the Proposed addresses empty state
  await caseDetailsPage.expectProposedAddressesEmptyState()
})
