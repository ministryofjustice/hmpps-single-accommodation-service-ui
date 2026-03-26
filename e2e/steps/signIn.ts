import { Page } from '@playwright/test'
import { UserLoginDetails } from '@sas/e2e'

// eslint-disable-next-line import/prefer-default-export
export const signIn = async (page: Page, user: UserLoginDetails) => {
  if (!user.username || !user.password) {
    throw new Error('Credentials missing, have you set the correct environment variables?')
  }

  await page.goto('/sign-out')
  await page.getByLabel('Username').fill(user.username)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}
