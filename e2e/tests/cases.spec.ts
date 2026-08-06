import { expect } from '@playwright/test'
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  minutesToMilliseconds,
  secondsToMilliseconds,
} from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/date-time'
import { test } from '../test'
import { signIn } from '../steps/signIn'
import { refreshUntil } from '../utils/refreshUntil'

test('Case list', async ({ page, users: { probation: probationUser }, cases }) => {
  test.setTimeout(minutesToMilliseconds(12))

  const [forename, surname] = cases.BASE_CASE.name.split(' ')

  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  const caseLink = page.getByRole('link', { name: `${surname}, ${forename}` })

  // AND I can see the expected allocated case
  await refreshUntil(page, () => expect(caseLink).toBeVisible(), {
    timeout: minutesToMilliseconds(11),
    intervals: [secondsToMilliseconds(15)],
  })

  // AND I click on the case link
  await caseLink.click()

  // THEN I should see the case details page
  await expect(page.getByRole('heading', { name: `${forename} ${surname}`, level: 1 })).toBeVisible()
})
