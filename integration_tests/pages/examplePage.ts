import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class ExamplePage extends AbstractPage {
  readonly header: Locator

  readonly message: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `The response message from SAS API's...` })
    this.message = page.getByText('Hello World!')
  }

  static async verifyOnPage(page: Page): Promise<ExamplePage> {
    const examplePage = new ExamplePage(page)
    await expect(examplePage.header).toBeVisible()
    return examplePage
  }
}
