import { expect, Page } from '@playwright/test'
import { ProposedAddressFormData } from '@sas/ui'
import { CaseDto as Case } from '@sas/api'
import AbstractPage from '../abstractPage'
import paths from '../../../server/paths/ui'
import { verifyPost } from '../../mockApis/wiremock'
import apiPaths from '../../../server/paths/api'
import {
  formatProposedAddressArrangement,
  formatProposedAddressNextAccommodation,
  formatProposedAddressSettledType,
  formatProposedAddressStatus,
} from '../../../server/utils/proposedAddresses'

export default class AddProposedAddressPage extends AbstractPage {
  constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Enter the address' })
  }

  static async visit(page: Page, caseData: Case): Promise<AddProposedAddressPage> {
    await page.goto(paths.proposedAddresses.start({ crn: caseData.crn }))
    return AddProposedAddressPage.verifyOnPage(page)
  }

  async clearAddressForm() {
    await this.clearInputByLabel('Address line 1')
    await this.clearInputByLabel('Address line 2')
    await this.clearInputByLabel('Town or city')
    await this.clearInputByLabel('County')
    await this.clearInputByLabel('Postal code')
    await this.clearInputByLabel('Country')
  }

  async completeAddressForm(proposedAddressData: ProposedAddressFormData) {
    const { address } = proposedAddressData
    await this.completeInputByLabel('Address line 1', address.buildingName)
    await this.completeInputByLabel('Address line 2', address.subBuildingName || '')
    await this.completeInputByLabel('Town or city', address.postTown)
    await this.completeInputByLabel('County', address.county || '')
    await this.completeInputByLabel('Postal code', address.postcode)
    await this.completeInputByLabel('Country', address.country)
  }

  async completeTypeForm(proposedAddressData: ProposedAddressFormData) {
    const arrangementLabel = formatProposedAddressArrangement(proposedAddressData.arrangementSubType)
    await this.selectRadioByLabel(arrangementLabel)
    if (proposedAddressData.arrangementSubType === 'OTHER') {
      await this.completeInputByLabel(
        'What is the other housing arrangement?',
        proposedAddressData.arrangementSubTypeDescription || '',
      )
    }
    const settledTypeLabel = formatProposedAddressSettledType(proposedAddressData.settledType)
    await this.selectRadioByLabel(settledTypeLabel)
  }

  async completeStatusForm(proposedAddressData: ProposedAddressFormData) {
    const statusLabel = formatProposedAddressStatus(proposedAddressData.verificationStatus)
    await this.selectRadioByLabel(statusLabel)
  }

  async completeNextAccommodationForm(proposedAddressData: ProposedAddressFormData) {
    const nextAccommodationLabel = formatProposedAddressNextAccommodation(proposedAddressData.nextAccommodationStatus)
    await this.selectRadioByLabel(nextAccommodationLabel)
  }

  async verifyCheckYourAnswersPage(proposedAddressData: ProposedAddressFormData, caseName: string) {
    await expect(this.page.getByText('Check your answers before adding the address')).toBeVisible()

    const { address } = proposedAddressData
    const addressLines = [
      address.buildingName,
      address.subBuildingName,
      address.postTown,
      address.county,
      address.postcode,
      address.country,
    ].filter(Boolean)

    this.shouldShowSummaryItem('Address', addressLines)

    const arrangementValue = [
      formatProposedAddressArrangement(proposedAddressData.arrangementSubType),
      proposedAddressData.arrangementSubTypeDescription,
    ].filter(Boolean)

    this.shouldShowSummaryItem(`What will be ${caseName}'s housing arrangement at this address?`, arrangementValue)
    this.shouldShowSummaryItem(
      'Will it be settled or transient?',
      formatProposedAddressSettledType(proposedAddressData.settledType),
    )
    this.shouldShowSummaryItem(
      'What is the status of the address checks?',
      formatProposedAddressStatus(proposedAddressData.verificationStatus),
    )

    if (proposedAddressData.verificationStatus === 'PASSED') {
      this.shouldShowSummaryItem(
        `Is this the next address that ${caseName} will be moving into?`,
        formatProposedAddressNextAccommodation(proposedAddressData.nextAccommodationStatus),
      )
    }
  }

  async shouldShowTypeForm(name: string) {
    await expect(
      this.page.getByRole('group', { name: `What will be ${name}'s housing arrangement at this address?` }),
    ).toBeVisible()
  }

  async shouldShowStatusForm() {
    await expect(this.page.getByRole('group', { name: 'What is the status of the address checks?' })).toBeVisible()
  }

  async shouldShowNextAccommodationForm(name: string) {
    await expect(
      this.page.getByRole('group', { name: `Is this the next address that ${name} will be moving into?` }),
    ).toBeVisible()
  }

  async shouldShowPopulatedAddressForm(addressData: ProposedAddressFormData) {
    const { address } = addressData
    await this.verifyTextInput('Address line 1', address.buildingName)
    await this.verifyTextInput('Address line 2', address.subBuildingName || '')
    await this.verifyTextInput('Town or city', address.postTown)
    await this.verifyTextInput('County', address.county || '')
    await this.verifyTextInput('Postal code', address.postcode)
    await this.verifyTextInput('Country', address.country)
  }

  async shouldShowPopulatedTypeForm(addressData: ProposedAddressFormData) {
    const arrangementLabel = formatProposedAddressArrangement(addressData.arrangementSubType)
    await this.verifyRadioInput(arrangementLabel)
    if (addressData.arrangementSubType === 'OTHER' && addressData.arrangementSubTypeDescription) {
      await this.verifyTextInput('What is the other housing arrangement?', addressData.arrangementSubTypeDescription)
    }
    const settledTypeLabel = formatProposedAddressSettledType(addressData.settledType)
    await this.verifyRadioInput(settledTypeLabel)
  }

  async shouldShowPopulatedStatusForm(addressData: ProposedAddressFormData) {
    const statusLabel = formatProposedAddressStatus(addressData.verificationStatus)
    await this.verifyRadioInput(statusLabel)
  }

  async shouldShowPopulatedNextAccommodationForm(addressData: ProposedAddressFormData) {
    const nextAccommodationLabel = formatProposedAddressNextAccommodation(addressData.nextAccommodationStatus)
    await this.verifyRadioInput(nextAccommodationLabel)
  }

  async checkApiCalled(crn: string, proposedAddressData: ProposedAddressFormData) {
    const requestBody = await verifyPost(apiPaths.cases.proposedAddresses.submit({ crn }))

    const expectedBody = {
      ...proposedAddressData,
      arrangementType: 'PRIVATE',
      nextAccommodationStatus: proposedAddressData.nextAccommodationStatus ?? 'TO_BE_DECIDED',
    }

    expect(requestBody).toEqual(expectedBody)
  }
}
