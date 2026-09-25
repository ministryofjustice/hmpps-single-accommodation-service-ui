import { expect } from '@playwright/test'
// eslint-disable-next-line import/no-extraneous-dependencies
import { minutesToMilliseconds } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/date-time'
import { test } from '../test'
import { signIn } from '../steps/signIn'
import { getCaseLink } from '../steps/getCaseLink'

test('Case list', async ({ page, users: { probation: probationUser }, cases: { BASE_CASE } }) => {
  test.setTimeout(minutesToMilliseconds(12))

  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // THEN I should see the case list page
  await expect(page.getByRole('heading', { name: 'Accommodation case list', level: 1 })).toBeVisible()

  // WHEN the expected case is not on the default tab
  const [expectedForename, expectedSurname] = BASE_CASE.name.split(' ')
  if (!(await page.getByRole('link', { name: `${expectedSurname}, ${expectedForename}` }).isVisible())) {
    await page.getByRole('link', { name: 'Settled housing secured' }).click()
  }

  // THEN I can see the expected case
  const { caseLink, forename, surname } = await getCaseLink(page, BASE_CASE)

  // WHEN I click on the case link
  await caseLink.click()

  // THEN I should see the case details page
  await expect(page.getByRole('heading', { name: `${forename} ${surname}`, level: 1 })).toBeVisible()
})
