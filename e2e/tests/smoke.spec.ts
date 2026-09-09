import { expect } from '@playwright/test'
import { test } from '../test'
import { signIn } from '../steps/signIn'

test('Smoke test', async ({ page, users: { probation: probationUser } }) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I click on the first result
  const firstCaseName = await page.getByRole('row').nth(1).getByRole('link').textContent()
  await page.getByRole('link', { name: firstCaseName }).click()

  // THEN I should see the case details page
  const fullName = firstCaseName.split(', ').reverse().join(' ')
  await expect(page.getByRole('heading', { name: fullName, level: 1 })).toBeVisible()

  // AND there should be no upstream errors
  await expect(page.getByText('Some information on this service is currently unavailable')).not.toBeVisible()
})
