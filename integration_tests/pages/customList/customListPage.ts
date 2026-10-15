import { Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CustomListPage extends AbstractPage {
  readonly casesRows: Locator

  constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Create a custom list' })

    this.casesRows = page.getByRole('table', { name: 'List of cases' }).getByRole('row')
  }
}
