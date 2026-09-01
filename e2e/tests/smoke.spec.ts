import { expect } from '@playwright/test'
import { test } from '../test'
import { signIn } from '../steps/signIn'
import { getCaseLink } from '../steps/getCaseLink'

test('Smoke test', async ({ page, users: { probation: probationUser }, cases: { BASE_CASE } }) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I navigate to the base test case
  const { caseLink, forename, surname } = await getCaseLink(page, BASE_CASE)
  await caseLink.click()

  // THEN I should see the case details page
  await expect(page.getByRole('heading', { name: `${forename} ${surname}`, level: 1 })).toBeVisible()

  // AND there should be no upstream errors
  await expect(page.getByText('Some information on this service is currently unavailable')).not.toBeVisible()
})
