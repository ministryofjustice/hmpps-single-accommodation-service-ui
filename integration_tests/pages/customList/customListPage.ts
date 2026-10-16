import { Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CustomListPage extends AbstractPage {
  constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Create a custom list' })
  }
}
