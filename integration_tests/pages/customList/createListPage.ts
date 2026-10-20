import { expect, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { verifyPost } from '../../mockApis/wiremock'
import apiPaths from '../../../server/paths/api'

export default class CreateListPage extends AbstractPage {
  constructor(page: Page) {
    super(page)
    this.header = page.locator('label', { hasText: 'Add CRNs' })
  }

  async shouldShowConfirmation(caption: string) {
    await expect(this.page.getByRole('heading', { name: caption })).toBeVisible()
  }

  async checkApiCalled(crnList: string[]) {
    const requestBody = await verifyPost(apiPaths.customList({}))
    expect(requestBody).toEqual(crnList)
  }
}
