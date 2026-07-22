import { expect } from '@playwright/test'
import { test } from '../test'
import { signIn } from '../steps/signIn'

test('Case list', async ({ page, users: { probation: probationUser }, cases }) => {
  // GIVEN a known case
  const { name } = cases['Base case']

  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I click on the case I want to check
  await page.getByRole('link', { name }).click()

  // THEN I should see the case details page
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible()
})
