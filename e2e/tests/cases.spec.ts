import { expect } from '@playwright/test'
import { test } from '../test'
import { signIn } from '../steps/signIn'

test('Case list', async ({ page, users: { probation: probationUser }, cases }) => {
  const [forename, surname] = cases.BASE_CASE.name.split(' ')

  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I click on the first result
  await page.getByRole('link', { name: `${surname}, ${forename}` }).click()

  // THEN I should see the case details page
  await expect(page.getByRole('heading', { name: `${forename} ${surname}`, level: 1 })).toBeVisible()
})
