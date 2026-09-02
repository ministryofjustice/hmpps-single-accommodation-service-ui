import { test } from '../test'
import { signIn } from '../steps/signIn'
import { getCaseLink } from '../steps/getCaseLink'
import CaseDetailsPage from '../pages/caseDetailsPage'

test.skip('CRS status is Not required', async ({
  page,
  users: { probation: probationUser },
  cases: { BASE_CASE },
  serviceUrls: { crs },
}) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I navigate to the base test case
  const { caseLink } = await getCaseLink(page, BASE_CASE)
  await caseLink.click()

  // WHEN I view the case details page
  const caseDetailsPage = new CaseDetailsPage(page)

  // THEN I should see the CRS status as Not required
  await caseDetailsPage.expectCrsStatus('Not required')

  // AND the Start referral link should point to the CRS service
  await caseDetailsPage.expectStartCrsReferralLink(crs)
})
