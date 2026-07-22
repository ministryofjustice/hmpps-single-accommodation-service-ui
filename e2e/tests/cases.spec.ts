import { expect } from '@playwright/test'
import { test } from '../test'
import { signIn } from '../steps/signIn'

test('Case list', async ({ page, users: { probation: probationUser }, cases }) => {
  const personName = cases.BASE_CASE.name

  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I click on the first result
  await page.getByRole('link', { name: personName }).click()

  // THEN I should see the case details page
  await expect(page.getByRole('heading', { name: personName, level: 1 })).toBeVisible()
})
