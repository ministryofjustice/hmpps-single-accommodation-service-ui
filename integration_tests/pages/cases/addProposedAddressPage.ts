import { expect, Locator, Page } from '@playwright/test'
import { ProposedAddressFormData } from '@sas/ui'
import { CaseDto as Case } from '@sas/api'
import AbstractPage from '../abstractPage'
import {
  formatProposedAddressArrangement,
  formatProposedAddressNextAccommodation,
  formatProposedAddressSettledType,
  formatProposedAddressStatus,
} from '../../../server/utils/format'
import paths from '../../../server/paths/ui'
import { verifyPost } from '../../mockApis/wiremock'
import apiPaths from '../../../server/paths/api'

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

  async clearAddressForm() {
    await this.page.fill('input[name="addressLine1"]', '')
    await this.page.fill('input[name="addressLine2"]', '')
    await this.page.fill('input[name="addressTown"]', '')
    await this.page.fill('input[name="addressCounty"]', '')
    await this.page.fill('input[name="addressPostcode"]', '')
    await this.page.fill('input[name="addressCountry"]', '')
  }

  async completeAddressForm(proposedAddressData: ProposedAddressFormData) {
    const { address } = proposedAddressData
    await this.page.fill('input[name="addressLine1"]', address.buildingName)
    await this.page.fill('input[name="addressLine2"]', address.subBuildingName || '')
    await this.page.fill('input[name="addressTown"]', address.postTown)
    await this.page.fill('input[name="addressCounty"]', address.county || '')
    await this.page.fill('input[name="addressPostcode"]', address.postcode)
    await this.page.fill('input[name="addressCountry"]', address.country)
  }

  async completeTypeForm(proposedAddressData: ProposedAddressFormData) {
    await this.page
      .locator(`input[name="arrangementSubType"][value="${proposedAddressData.arrangementSubType}"]`)
      .check()
    if (proposedAddressData.arrangementSubType === 'OTHER') {
      await this.page.fill(
        'input[name="arrangementSubTypeDescription"]',
        proposedAddressData.arrangementSubTypeDescription || '',
      )
    }
    await this.page.locator(`input[name="settledType"][value="${proposedAddressData.settledType}"]`).check()
  }

  async completeStatusForm(proposedAddressData: ProposedAddressFormData) {
    await this.page
      .locator(`input[name="verificationStatus"][value="${proposedAddressData.verificationStatus}"]`)
      .check()
  }

  async completeNextAccommodationForm(proposedAddressData: ProposedAddressFormData) {
    await this.page
      .locator(`input[name="nextAccommodationStatus"][value="${proposedAddressData.nextAccommodationStatus}"]`)
      .check()
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
    await expect(arrangementRow).toContainText(formatProposedAddressArrangement(proposedAddressData.arrangementSubType))
    if (proposedAddressData.arrangementSubTypeDescription) {
      await expect(arrangementRow).toContainText(proposedAddressData.arrangementSubTypeDescription)
    }

    const settledTypeText = formatProposedAddressSettledType(proposedAddressData.settledType)
    await expect(row('Will it be settled or transient?')).toContainText(settledTypeText)
    const statusText = formatProposedAddressStatus(proposedAddressData.verificationStatus)
    await expect(row('What is the status of the address checks?')).toContainText(statusText)

    if (proposedAddressData.verificationStatus === 'PASSED') {
      const nextAccommodationText = formatProposedAddressNextAccommodation(proposedAddressData.nextAccommodationStatus)
      await expect(row(`Is this the next address that ${caseName} will be moving into?`)).toContainText(
        nextAccommodationText,
      )
    }
  }

  async shouldShowTypeForm(name: string) {
    await expect(this.page.getByText(`What will be ${name}'s housing arrangement at this address?`)).toBeVisible()
  }

  async shouldShowStatusForm() {
    await expect(this.page.getByText('What is the status of the address checks?')).toBeVisible()
  }

  async shouldShowNextAccommodationForm(name: string) {
    await expect(this.page.getByText(`Is this the next address that ${name} will be moving into?`)).toBeVisible()
  }

  async shouldShowPopulatedAddressForm(addressData: ProposedAddressFormData) {
    const { address } = addressData
    await this.verifyTextInputByName('addressLine1', address.buildingName)
    await this.verifyTextInputByName('addressLine2', address.subBuildingName || '')
    await this.verifyTextInputByName('addressTown', address.postTown)
    await this.verifyTextInputByName('addressCounty', address.county || '')
    await this.verifyTextInputByName('addressPostcode', address.postcode)
    await this.verifyTextInputByName('addressCountry', address.country)
  }

  async shouldShowPopulatedTypeForm(addressData: ProposedAddressFormData) {
    await this.verifyRadioInputByName('arrangementSubType', addressData.arrangementSubType)
    if (addressData.arrangementSubType === 'OTHER' && addressData.arrangementSubTypeDescription) {
      await this.verifyTextInputByName('arrangementSubTypeDescription', addressData.arrangementSubTypeDescription)
    }
    await this.verifyRadioInputByName('settledType', addressData.settledType)
  }

  async shouldShowPopulatedStatusForm(addressData: ProposedAddressFormData) {
    await this.verifyRadioInputByName('verificationStatus', addressData.verificationStatus)
  }

  async shouldShowPopulatedNextAccommodationForm(addressData: ProposedAddressFormData) {
    await this.verifyRadioInputByName('nextAccommodationStatus', addressData.nextAccommodationStatus)
  }

  async checkApiCalled(crn: string, proposedAddressData: ProposedAddressFormData) {
    const requestBody = await verifyPost(apiPaths.cases.proposedAddresses.submit({ crn }))

    expect(requestBody.address).toEqual(proposedAddressData.address)
    expect(requestBody.arrangementSubType).toEqual(proposedAddressData.arrangementSubType)
    expect(requestBody.arrangementSubTypeDescription).toEqual(proposedAddressData.arrangementSubTypeDescription)
    expect(requestBody.settledType).toEqual(proposedAddressData.settledType)
    expect(requestBody.verificationStatus).toEqual(proposedAddressData.verificationStatus)
    if (proposedAddressData.verificationStatus === 'PASSED') {
      expect(requestBody.nextAccommodationStatus).toEqual(proposedAddressData.nextAccommodationStatus)
    }
  }
}
