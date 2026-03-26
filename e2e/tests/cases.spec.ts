import { expect } from '@playwright/test'
import { test } from '../test'
import { signIn } from '../steps/signIn'

test('Case list', async ({ page, users: { probation: probationUser } }) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // WHEN I search for a known CRN
  await page.getByLabel('Search by name, CRN or prison number').fill('X371199')
  await page.getByRole('button', { name: 'Apply filters' }).click()

  // AND I click on the first result
  await page.getByRole('link', { name: 'Ben Davies' }).click()

  // THEN I should see the case details page
  await expect(page.getByRole('heading', { name: 'Ben Davies', level: 1 })).toBeVisible()
})
