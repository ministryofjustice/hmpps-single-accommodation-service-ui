import { expect, test } from '@playwright/test'
import { resetStubs } from '../mockApis/wiremock'
import casesApi from '../mockApis/cases'
import userApi from '../mockApis/user'
import { login } from '../testUtils'
import config from '../../server/config'

test.describe('error handling', () => {
  test.beforeEach(async () => {
    await userApi.stubGetTeams()
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('SAS API failure shows error page', async ({ page }) => {
    await casesApi.stubGetCases500()

    await login(page)

    await expect(page.locator('h1', { hasText: 'Sorry, there is a problem with the service' })).toBeVisible()
  })

  test('SAS API not found shows not found page', async ({ page }) => {
    await casesApi.stubGetCases404()

    await login(page)

    await expect(page.locator('h1', { hasText: 'Page not found' })).toBeVisible()
  })

  test('SAS API not authorised failure shows not authorised page', async ({ page }) => {
    await casesApi.stubGetCases403()

    await login(page)

    await expect(
      page.locator('h1', { hasText: 'You do not have permission to access the Accommodation service' }),
    ).toBeVisible()

    await expect(page.getByRole('link', { name: 'Accommodation service Private Beta Teams channel' })).toHaveAttribute(
      'href',
      config.supportLinks.accessRequest,
    )
  })
})
