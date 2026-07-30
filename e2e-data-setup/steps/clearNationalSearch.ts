import { expect, Page } from '@playwright/test'

async function clearNationalSearch(page: Page) {
  await page.getByRole('link', { name: 'National Search' }).click()
  await expect(page).toHaveTitle(/National Search/)
  await page.getByRole('button', { name: 'Clear Search Fields' }).click()
  await expect(page).toHaveTitle(/National Search/)
}

export default clearNationalSearch
