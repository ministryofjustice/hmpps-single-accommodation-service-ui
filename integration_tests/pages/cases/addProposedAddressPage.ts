import { expect, Page } from '@playwright/test'
import { ProposedAddressFormData, RadioItem } from '@sas/ui'
import { CaseDto as Case } from '@sas/api'
import AbstractPage from '../abstractPage'
import paths from '../../../server/paths/ui'
import { verifyPost } from '../../mockApis/wiremock'
import apiPaths from '../../../server/paths/api'
import {
  formatProposedAddressNextAccommodation,
  formatProposedAddressStatus,
  formDataToRequestBody,
} from '../../../server/utils/proposedAddresses'
import { accommodationTypesMap } from '../../../server/testutils/factories/proposedAccommodation'

export default class AddProposedAddressPage extends AbstractPage {
  constructor(
    page: Page,
    private readonly crn: string,
    expectedHeader = 'What is the address?',
  ) {
    super(page)
    this.header = page.getByRole('group', { name: expectedHeader })
  }

  static async visit(page: Page, caseData: Case): Promise<AddProposedAddressPage> {
    await page.goto(paths.proposedAddresses.start({ crn: caseData.crn }))
    return AddProposedAddressPage.verifyOnPage(page, caseData.crn)
  }

  async shouldShowAddressLookupForm(nameOrNumber: string = '', postcode: string = '') {
    await expect(this.page.getByRole('textbox', { name: 'Property name or number' })).toHaveValue(nameOrNumber)
    await expect(this.page.getByRole('textbox', { name: 'UK postcode' })).toHaveValue(postcode)

    await expect(this.page.getByRole('link', { name: 'Enter address manually' })).toHaveAttribute(
      'href',
      `/cases/${this.crn}/proposed-addresses/details`,
    )
  }

  async completeLookupForm(nameOrNumber: string, postcode: string) {
    await this.completeInputByLabel('Property name or number', nameOrNumber)
    await this.completeInputByLabel('UK postcode', postcode)
  }

  async shouldShowSelectAddressForm(nameOrNumber: string, postcode: string, expectedResults: RadioItem[]) {
    await expect(this.page.locator('dt:text("Property name or number") + dd')).toHaveText(nameOrNumber)
    await expect(this.page.locator('dt:text("UK postcode") + dd')).toHaveText(postcode)

    await expect(this.page.getByRole('link', { name: 'Change' })).toHaveAttribute(
      'href',
      paths.proposedAddresses.lookup({ crn: this.crn }),
    )

    await expect(this.page.getByRole('group', { name: 'Select an address' })).toBeVisible()
    for await (const { text, value } of expectedResults) {
      await expect(this.page.getByRole('radio', { name: text })).toHaveValue(value)
    }
  }

  async completeAddressLookupResultsForm(address: string) {
    await this.selectRadioByLabel(address)
  }

  async shouldShowDetailsForm() {
    await expect(this.page.getByRole('heading', { name: `Enter the address` })).toBeVisible()
    await expect(this.page.getByRole('textbox', { name: 'Address line 1' })).toBeVisible()
    await expect(this.page.getByRole('textbox', { name: 'Address line 2 (optional)' })).toBeVisible()
    await expect(this.page.getByRole('textbox', { name: 'Town or city' })).toBeVisible()
    await expect(this.page.getByRole('textbox', { name: 'County (optional)' })).toBeVisible()
    await expect(this.page.getByRole('textbox', { name: 'Postal code or zip code (if you have one)' })).toBeVisible()
    await expect(this.page.getByRole('textbox', { name: 'Country' })).toBeVisible()
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
    await this.selectRadioByLabel(accommodationTypesMap[proposedAddressData.accommodationTypeCode])
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

    await this.shouldShowSummaryItem('Address', addressLines)
    await this.shouldShowSummaryItem(
      `Which best describes the living arrangement for ${caseName} at this address?`,
      accommodationTypesMap[proposedAddressData.accommodationTypeCode],
    )
    await this.shouldShowSummaryItem(
      'What is the status of the address checks?',
      formatProposedAddressStatus(proposedAddressData.verificationStatus),
    )

    if (proposedAddressData.verificationStatus === 'PASSED') {
      await this.shouldShowSummaryItem(
        `Is this the next address that ${caseName} will be moving into?`,
        formatProposedAddressNextAccommodation(proposedAddressData.nextAccommodationStatus),
      )
    }
  }

  async shouldShowTypeForm(name: string) {
    await expect(
      this.page.getByRole('group', {
        name: `Which best describes the living arrangement for ${name} at this address?`,
      }),
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
    await this.verifyRadioInput(accommodationTypesMap[addressData.accommodationTypeCode])
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

    const expectedBody = formDataToRequestBody(proposedAddressData)

    expect(requestBody).toEqual(expectedBody)
  }
}
