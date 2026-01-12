import { expect, test } from '@playwright/test'
import hmppsAuth from '../mockApis/hmppsAuth'
import casesApi from '../mockApis/cases'

import { login, resetStubs } from '../testUtils'
import CasesListPage from '../pages/cases/listPage'

test.describe('SignIn', () => {
  test.beforeEach(async () => {
    await casesApi.stubGetCases()
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Unauthenticated user directed to auth', async ({ page }) => {
    await hmppsAuth.stubSignInPage()
    await page.goto('/')

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('Unauthenticated user navigating to sign in page directed to auth', async ({ page }) => {
    await hmppsAuth.stubSignInPage()
    await page.goto('/sign-in')

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('User name visible in header', async ({ page }) => {
    await login(page, { name: 'A TestUser' })

    const casesListPage = await CasesListPage.verifyOnPage(page)

    await expect(casesListPage.usersName).toHaveText('A. Testuser')
  })

  test('User can sign out', async ({ page }) => {
    await login(page)

    const casesListPage = await CasesListPage.verifyOnPage(page)
    await casesListPage.signOut()

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('Token verification failure takes user to sign in page', async ({ page }) => {
    await login(page, { active: false })

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('Token verification failure clears user session', async ({ page }) => {
    await login(page, { name: 'A TestUser', active: false })

    await expect(page.getByRole('heading')).toHaveText('Sign in')

    await login(page, { name: 'Some OtherTestUser', active: true })

    const casesListPage = await CasesListPage.verifyOnPage(page)
    await expect(casesListPage.usersName).toHaveText('S. Othertestuser')
  })
})
