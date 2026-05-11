import { expect, Page } from '@playwright/test'
import { CaseDto } from '@sas/api'
import AbstractPage from '../abstractPage'

export default class LaoAccessPage extends AbstractPage {
  constructor(
    page: Page,
    readonly caseData: CaseDto,
  ) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Limited access offender' })
  }

  async shouldHaveContent() {
    await expect(this.page.locator('.sas-definition-list', { hasText: 'CRN:' })).toContainText(this.caseData.crn)
    await expect(
      this.page.getByRole('link', { name: 'Raise a request for access through ServiceNow (opens in new tab)' }),
    ).toHaveAttribute(
      'href',
      'https://mojprod.service-now.com/moj_sp?id=sc_cat_item&table=sc_cat_item&sys_id=711e47b91bfe195025dc6351f54bcb7b&searchTerm=limited%20access%20offender%20permission',
    )
  }
}
