import { expect, test } from '@playwright/test'
import { resetStubs } from '../mockApis/wiremock'
import casesApi from '../mockApis/cases'
import { login } from '../testUtils'

test.describe('error handling', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('SAS API failure shows error page', async ({ page }) => {
    await casesApi.stubGetCases500()

    await login(page)

    await expect(page.locator('h1', { hasText: 'Internal Server Error' })).toBeVisible()
  })
})
