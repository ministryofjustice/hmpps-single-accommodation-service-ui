import { expect, Page } from '@playwright/test'

export default class BasePage {
  constructor(protected readonly page: Page) {}

  protected async expectHeadingToBeDisplayed(options: { name: string | RegExp; level?: number }) {
    const heading = this.page.getByRole('heading', options)

    try {
      await expect(heading).toBeVisible()
    } catch (error) {
      const actualHeading = await this.page
        .locator('h1')
        .first()
        .innerText()
        .catch(() => '<no heading found>')

      throw new Error(
        `Expected heading "${options.name}" to be visible, but found "${actualHeading}" on ${this.page.url()}`,
        { cause: error },
      )
    }
  }
}
