import { expect, Page } from '@playwright/test'

// eslint-disable-next-line import/prefer-default-export
export async function expectHeadingToBeDisplayed(page: Page, options: { name: string | RegExp; level?: number }) {
  const heading = page.getByRole('heading', options)
  const message = `Expected heading "${options.name}" to be visible, but current page is ${page.url()}`

  await expect(heading, message).toBeVisible()
}
