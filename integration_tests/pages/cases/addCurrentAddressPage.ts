import { expect, Page } from '@playwright/test'
import { CaseDto } from '@sas/api'
import AbstractPage from '../abstractPage'
import { deliusAddressHistoryUrl } from '../../../server/utils/currentAddress'
import { displayName } from '../../../server/utils/cases'

export default class AddCurrentAddressPage extends AbstractPage {
  constructor(
    page: Page,
    private readonly caseData: CaseDto,
  ) {
    super(page)

    this.header = page.locator('h1', { hasText: 'Add a new current address' })
  }

  async shouldShowDeliusLink() {
    await expect(
      this.page.getByText(`Record a new current address for ${displayName(this.caseData)} in nDelius.`),
    ).toBeVisible()

    const link = this.page.getByRole('link', { name: 'Go to nDelius (opens in new tab)' })
    await expect(link).toHaveAttribute('href', deliusAddressHistoryUrl(this.caseData.crn))
    await expect(link).toHaveAttribute('target', '_blank')
  }
}
