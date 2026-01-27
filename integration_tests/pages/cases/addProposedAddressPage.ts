import { expect, Locator, Page } from '@playwright/test'
import { ProposedAddressFormData } from '@sas/ui'
import AbstractPage from '../abstractPage'
import { formatProposedAddressArrangement } from '../../../server/utils/format'

export default class AddProposedAddressPage extends AbstractPage {
  readonly header: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Enter the address' })
  }

  static async verifyOnPage(page: Page): Promise<AddProposedAddressPage> {
    const addProposedAddressPage = new AddProposedAddressPage(page)
    await expect(addProposedAddressPage.header).toBeVisible()
    return addProposedAddressPage
  }

  async completeAddressForm(proposedAddressData: ProposedAddressFormData) {
    const { address } = proposedAddressData
    await this.page.fill('input[name="addressLine1"]', address.line1)
    if (address.line2) {
      await this.page.fill('input[name="addressLine2"]', address.line2)
    }
    await this.page.fill('input[name="addressTown"]', address.city)
    await this.page.fill('input[name="addressCounty"]', address.region)
    await this.page.fill('input[name="addressPostcode"]', address.postcode)
    await this.page.fill('input[name="addressCountry"]', address.country)
  }

  async completeTypeForm(proposedAddressData: ProposedAddressFormData) {
    await this.page
      .locator(`input[name="housingArrangementType"][value="${proposedAddressData.housingArrangementType}"]`)
      .check()
    if (proposedAddressData.housingArrangementType === 'OTHER') {
      await this.page.fill(
        'input[name="housingArrangementTypeDescription"]',
        proposedAddressData.housingArrangementTypeDescription || '',
      )
    }
    await this.page.locator(`input[name="settledType"][value="${proposedAddressData.settledType}"]`).check()
  }

  async completeStatusForm(proposedAddressData: ProposedAddressFormData) {
    await this.page.locator(`input[name="status"][value="${proposedAddressData.status}"]`).check()
  }

  async verifyCheckYourAnswersPage(proposedAddressData: ProposedAddressFormData, caseName: string) {
    await expect(this.page.getByText('Check your answers before adding the address')).toBeVisible()
    const row = (key: string) =>
      this.page.locator('.govuk-summary-list__row', { has: this.page.getByText(key, { exact: true }) })

    const { address } = proposedAddressData
    const addressLines = [
      address.line1,
      address.line2,
      address.city,
      address.region,
      address.postcode,
      address.country,
    ].filter(Boolean)

    for (const line of addressLines) {
      await expect(row('Address')).toContainText(line)
    }
    const housingArrangementText = [
      formatProposedAddressArrangement(proposedAddressData.housingArrangementType),
      proposedAddressData.housingArrangementTypeDescription,
    ]
      .filter(Boolean)
      .join('\n')
    await expect(row(`What will be the ${caseName}'s housing arrangement at this address?`)).toContainText(
      housingArrangementText,
    )
    const settledTypeText = proposedAddressData.settledType === 'SETTLED' ? 'Settled' : 'Transient'
    await expect(row('Will it be settled or transient?')).toContainText(settledTypeText)
    const statusText = proposedAddressData.status === 'PASSED' ? 'Passed' : 'Failed'
    await expect(row('What is the status of the address checks?')).toContainText(statusText)
  }

  async clickContinue() {
    await this.page.getByText('Continue').first().click()
  }

  async clickSave() {
    await this.page.getByText('Save').first().click()
  }
}
