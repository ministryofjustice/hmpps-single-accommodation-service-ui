import { expect, Page } from '@playwright/test'

// eslint-disable-next-line import/prefer-default-export
export async function expectHeadingToBeDisplayed(page: Page, options: { name: string | RegExp; level?: number }) {
  const heading = page.getByRole('heading', options)

  try {
    await expect(heading).toBeVisible()
  } catch (error) {
    const actualHeading = await page
      .locator('h1')
      .first()
      .innerText({ timeout: 1000 })
      .catch(() => '<no heading found>')

    throw new Error(`Expected heading "${options.name}" to be visible, but found "${actualHeading}" on ${page.url()}`, {
      cause: error,
    })
  }
}
