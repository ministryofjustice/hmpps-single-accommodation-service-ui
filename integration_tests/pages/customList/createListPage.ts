import { expect, Page } from '@playwright/test'
import { CaseDto } from '@sas/api'
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

  async checkUpdateListApiCalled(crnList?: string[]) {
    const requestBody = await verifyPost(apiPaths.customList.updateList({}))
    expect(requestBody).toEqual(crnList)
  }

  async checkGetCasesApiCalled(cases: CaseDto[]) {
    const requestBody = await verifyPost(apiPaths.customList.getCases({}))
    expect(requestBody).toEqual(cases)
  }

  async checkCustomListCrnsApiCalled(crnList: string[]) {
    const requestBody = await verifyPost(apiPaths.customList.getList({}))
    expect(requestBody).toEqual(crnList)
  }
}
