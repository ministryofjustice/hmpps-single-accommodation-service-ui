import { Page } from '@playwright/test'
import PageWithCaseList from '../pageWithCaseList'

export default class ShowCaseListPage extends PageWithCaseList {
  constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Custom list' })
  }
}
