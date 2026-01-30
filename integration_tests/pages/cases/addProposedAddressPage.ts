import { expect, Locator, Page } from '@playwright/test'
import { ProposedAddressFormData } from '@sas/ui'
import { CaseDto as Case } from '@sas/api'
import AbstractPage from '../abstractPage'
import {
  formatProposedAddressArrangement,
  formatProposedAddressSettledType,
  formatProposedAddressStatus,
} from '../../../server/utils/format'
import paths from '../../../server/paths/ui'

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

  static async visit(page: Page, caseData: Case): Promise<AddProposedAddressPage> {
    await page.goto(paths.proposedAddresses.start({ crn: caseData.crn }))
    return AddProposedAddressPage.verifyOnPage(page)
  }

  async completeAddressForm(proposedAddressData: ProposedAddressFormData) {
    const { address } = proposedAddressData
    await this.page.fill('input[name="addressLine1"]', address.buildingName)
    if (address.subBuildingName) {
      await this.page.fill('input[name="addressLine2"]', address.subBuildingName)
    }
    await this.page.fill('input[name="addressTown"]', address.postTown)
    if (address.county) {
      await this.page.fill('input[name="addressCounty"]', address.county)
    }
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
      address.buildingName,
      address.subBuildingName,
      address.postTown,
      address.county,
      address.postcode,
      address.country,
    ].filter(Boolean)
    for await (const line of addressLines) {
      await expect(row('Address')).toContainText(line)
    }

    const arrangementRow = row(`What will be ${caseName}'s housing arrangement at this address?`)
    await expect(arrangementRow).toContainText(
      formatProposedAddressArrangement(proposedAddressData.housingArrangementType),
    )
    if (proposedAddressData.housingArrangementTypeDescription) {
      await expect(arrangementRow).toContainText(proposedAddressData.housingArrangementTypeDescription)
    }

    const settledTypeText = formatProposedAddressSettledType(proposedAddressData.settledType)
    await expect(row('Will it be settled or transient?')).toContainText(settledTypeText)
    const statusText = formatProposedAddressStatus(proposedAddressData.status)
    await expect(row('What is the status of the address checks?')).toContainText(statusText)
  }

  async clickContinue() {
    await this.page.getByText('Continue').first().click()
  }

  async clickSave() {
    await this.page.getByText('Save').first().click()
  }
}
