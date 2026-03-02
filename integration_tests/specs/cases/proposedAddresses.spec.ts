import { test } from '@playwright/test'
import { AccommodationDetail, CaseDto } from '@sas/api'
import { ProposedAddressFormData } from '@sas/ui'
import casesApi from '../../mockApis/cases'
import proposedAddressesApi from '../../mockApis/proposedAddresses'
import dutyToReferApi from '../../mockApis/dutyToRefer'
import eligibilityApi from '../../mockApis/eligibility'
import osDataHubApi from '../../mockApis/osDataHubApi'
import { login } from '../../testUtils'
import {
  accommodationFactory,
  addressFactory,
  caseFactory,
  proposedAddressFormFactory,
} from '../../../server/testutils/factories'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import AddProposedAddressPage from '../../pages/cases/addProposedAddressPage'
import osDataHubApiResponse from '../../../server/testutils/fixtures/osDataHubApi/getPostcode.json'

import { resultToAddressDetails } from '../../../server/utils/osDataHub'
import { formatAddress } from '../../../server/utils/addresses'
import ProposedAddressDetailsPage from '../../pages/cases/proposedAddressDetailsPage'

test.describe('view proposed address details', () => {
  test('should allow user to view the details of a proposed address', async ({ page }) => {
    const caseData = caseFactory.build()
    const { crn } = caseData
    const proposedAddress = accommodationFactory.proposed().build({ crn })

    await casesApi.stubGetCases([caseData])
    await casesApi.stubGetCaseByCrn(crn, caseData)
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, undefined)
    await eligibilityApi.stubGetEligibilityByCrn(crn, undefined)
    await casesApi.stubGetReferralHistory(crn, [])
    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, [proposedAddress])
    await proposedAddressesApi.stubGetProposedAddress(crn, proposedAddress.id, proposedAddress)

    // Given I am logged in
    await login(page)

    // When I visit profile tracker page with a proposed address
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // When I click the link to view address details in the proposed address card
    await profileTrackerPage.clickLink('Notes', profileTrackerPage.getCard(formatAddress(proposedAddress.address)))

    // Then I should see the address details page
    const addressDetailsPage = await ProposedAddressDetailsPage.verifyOnPage(page, proposedAddress)

    // And the person's profile should be shown
    await addressDetailsPage.shouldShowCaseDetails(caseData)

    // And the address details should be listed
    await addressDetailsPage.shouldShowProposedAddressSummary()
  })
})

test.describe('add proposed address', () => {
  const crn = 'X123456'
  const caseData = caseFactory.build({ crn })
  const proposedAddresses = [
    accommodationFactory.proposed().build({ crn, verificationStatus: 'NOT_CHECKED_YET' }),
    accommodationFactory.proposed().build({ crn, verificationStatus: 'FAILED' }),
  ]

  test.beforeEach(async () => {
    // Given there is data for the given case
    await casesApi.stubGetCases([caseData])
    await casesApi.stubGetCaseByCrn(crn, caseData)
    await dutyToReferApi.stubGetAllDutyToReferByCrn(crn, undefined)
    await eligibilityApi.stubGetEligibilityByCrn(crn, undefined)
    await casesApi.stubGetReferralHistory(crn, [])
    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, proposedAddresses)
    await proposedAddressesApi.stubSubmitProposedAddress(crn)
  })

  test('should allow user to add a new proposed address entered manually', async ({ page }) => {
    const initialProposedAddressData = proposedAddressFormFactory
      .manualAddress()
      .build({ verificationStatus: 'NOT_CHECKED_YET' })
    const updatedProposedAddressData = proposedAddressFormFactory
      .manualAddress()
      .build({ verificationStatus: 'PASSED', nextAccommodationStatus: 'YES' })

    const newProposedAddress = accommodationFactory.proposed().build({
      ...updatedProposedAddressData,
      crn,
      address: addressFactory.minimal().build(updatedProposedAddressData.address),
    })
    const updatedProposedAddresses: AccommodationDetail[] = [...proposedAddresses, newProposedAddress]

    // Given I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // And I click the add an address link
    await profileTrackerPage.clickLink('Add an address')

    // Then I should see the address lookup form
    const addProposedAddressPage = await AddProposedAddressPage.verifyOnPage(page, crn)
    await addProposedAddressPage.shouldShowAddressLookupForm()

    // When I click on 'Enter address manually'
    await addProposedAddressPage.clickLink('Enter address manually')

    // Then I should see the add address form
    await addProposedAddressPage.shouldShowDetailsForm()

    // When I submit the form empty
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see errors
    await addProposedAddressPage.shouldShowErrorMessagesForFields({
      addressLine1: 'Enter address line 1',
      addressPostcode: 'Enter postcode',
      addressTown: 'Enter town or city',
      addressCountry: 'Enter country',
    })

    // Then I complete the address form
    await addProposedAddressPage.completeAddressForm(initialProposedAddressData)
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the type form
    await addProposedAddressPage.shouldShowTypeForm(caseData.name)

    // When I submit the form empty
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see errors
    await addProposedAddressPage.shouldShowErrorMessagesForFields({
      arrangementSubType: 'Select an arrangement type',
      settledType: 'Select a settled type',
    })

    // When I select 'Other' for arrangement type and submit without description
    await addProposedAddressPage.selectRadioByLabel('Other')
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see an error for the missing description
    await addProposedAddressPage.shouldShowErrorMessagesForFields({
      arrangementSubTypeDescription: 'Enter the other arrangement type',
      settledType: 'Select a settled type',
    })

    // Then I complete the type form
    await addProposedAddressPage.completeTypeForm(initialProposedAddressData)
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the status form
    await addProposedAddressPage.shouldShowStatusForm()

    // When I submit the form empty
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see errors
    await addProposedAddressPage.shouldShowErrorMessagesForFields({
      verificationStatus: 'Select a status',
    })

    // Then I complete the status form
    await addProposedAddressPage.completeStatusForm(initialProposedAddressData)
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the check your answers page with my entered data
    await addProposedAddressPage.verifyCheckYourAnswersPage(initialProposedAddressData, caseData.name)

    // When I click the back link
    await addProposedAddressPage.clickLink('Back')

    // Then I should see the populated status form
    await addProposedAddressPage.shouldShowPopulatedStatusForm(initialProposedAddressData)

    // When I click the back link
    await addProposedAddressPage.clickLink('Back')

    // Then I should see the populated type form
    await addProposedAddressPage.shouldShowPopulatedTypeForm(initialProposedAddressData)

    // When I click the back link
    await addProposedAddressPage.clickLink('Back')

    // Then I should see the populated address form
    await addProposedAddressPage.shouldShowPopulatedAddressForm(initialProposedAddressData)

    // When I clear and update the address form
    await addProposedAddressPage.clearAddressForm()
    await addProposedAddressPage.completeAddressForm(updatedProposedAddressData)
    await addProposedAddressPage.clickButton('Continue')

    // And I complete the type form with new data
    await addProposedAddressPage.completeTypeForm(updatedProposedAddressData)
    await addProposedAddressPage.clickButton('Continue')

    // And I complete the status form with new data
    await addProposedAddressPage.completeStatusForm(updatedProposedAddressData)
    await addProposedAddressPage.clickButton('Continue')

    // And I complete the next accommodation form with new data
    await addProposedAddressPage.completeNextAccommodationForm(updatedProposedAddressData)
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the check your answers page with my updated data
    await addProposedAddressPage.verifyCheckYourAnswersPage(updatedProposedAddressData, caseData.name)

    // When I submit the proposed address
    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, updatedProposedAddresses)
    await addProposedAddressPage.clickButton('Save')

    // Then the API should have been called with the correct data
    await addProposedAddressPage.checkApiCalled(crn, updatedProposedAddressData)

    // And I see the profile tracker page
    await ProfileTrackerPage.verifyOnPage(page, caseData)

    // And I should see a success banner confirming the proposed address was added
    await profileTrackerPage.shouldShowBanner('Private address added')

    // And the new proposed address should be shown in the proposed addresses section
    await profileTrackerPage.shouldShowProposedAddresses(updatedProposedAddresses)
  })

  test('should allow the user to lookup an address and add it', async ({ page }) => {
    const proposedAddressData = proposedAddressFormFactory.build({
      verificationStatus: 'NOT_CHECKED_YET',
    })
    const selectedAddress = addressFactory.build(
      resultToAddressDetails(
        osDataHubApiResponse.results.find(result => result.DPA.ADDRESS === '19A, KEPPEL ROAD, MANCHESTER, M21 0BP'),
      ),
    )

    await osDataHubApi.stubOsDataHubGetPostcode('M21 0BP', osDataHubApiResponse)
    await osDataHubApi.stubOsDataHubGetPostcode('N0 0PE', { ...osDataHubApiResponse, results: [] })
    const expectedOsResults = [
      { text: '19 Keppel Road, Manchester, M21 0BP', value: '10094949108' },
      { text: '19a, Keppel Road, Manchester, M21 0BP', value: '10094949109' },
    ]

    // Given I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // And I click the add an address link
    await profileTrackerPage.clickLink('Add an address')

    // Then I should see the address lookup form
    const addProposedAddressPage = await AddProposedAddressPage.verifyOnPage(page, crn)
    await addProposedAddressPage.shouldShowAddressLookupForm()

    // When I submit the form empty
    await addProposedAddressPage.clickButton('Find address')

    // Then I should see errors
    await addProposedAddressPage.shouldShowErrorMessagesForFields({
      nameOrNumber: 'Enter a property name or number',
      postcode: 'Enter a UK postcode',
    })

    // When I complete the form
    await addProposedAddressPage.completeLookupForm('19', 'M21 0BP')
    await addProposedAddressPage.clickButton('Find address')

    // Then I should see the address lookup results
    await addProposedAddressPage.shouldShowSelectAddressForm('19', 'M21 0BP', expectedOsResults)

    // When I submit without selecting a result
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see an error
    await addProposedAddressPage.shouldShowErrorMessagesForFields({
      addressUprn: 'Select an address',
    })

    // When I select a result
    await addProposedAddressPage.completeAddressLookupResultsForm('19 Keppel Road, Manchester, M21 0BP')
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the type form
    await addProposedAddressPage.shouldShowTypeForm(caseData.name)

    // When I click back
    await addProposedAddressPage.clickLink('Back')

    // And I click to change the building name
    await addProposedAddressPage.clickLink('Change')

    // Then I should see the address lookup form with the building name prepopulated
    await addProposedAddressPage.shouldShowAddressLookupForm('19', 'M21 0BP')

    // When I change the postcode to one with no results
    await addProposedAddressPage.completeLookupForm('19', 'N0 0PE')
    await addProposedAddressPage.clickButton('Find address')

    // Then I should see an error
    await addProposedAddressPage.shouldShowGenericErrorMessage(
      'No addresses found for this property name or number and UK postcode',
    )

    // When I change the postcode to one with one result
    await addProposedAddressPage.completeLookupForm('19a', 'M21 0BP')
    await addProposedAddressPage.clickButton('Find address')

    // Then I should see the type form
    await addProposedAddressPage.shouldShowTypeForm(caseData.name)

    // When I complete the type form
    await addProposedAddressPage.completeTypeForm(proposedAddressData)
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the status form
    await addProposedAddressPage.shouldShowStatusForm()

    // When I complete the status form
    await addProposedAddressPage.completeStatusForm(proposedAddressData)
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the check your answers page with my entered data
    const submittedAddress = { ...proposedAddressData, address: selectedAddress }
    await addProposedAddressPage.verifyCheckYourAnswersPage(submittedAddress, caseData.name)

    // When I submit the proposed address
    const newProposedAddress = accommodationFactory.proposed().build(submittedAddress)
    const updatedProposedAddresses: AccommodationDetail[] = [...proposedAddresses, newProposedAddress]
    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, updatedProposedAddresses)
    await addProposedAddressPage.clickButton('Save')

    // Then the API should have been called with the correct data
    await addProposedAddressPage.checkApiCalled(crn, submittedAddress)

    // And I see the profile tracker page
    await ProfileTrackerPage.verifyOnPage(page, caseData)

    // And I should see a success banner confirming the proposed address was added
    await profileTrackerPage.shouldShowBanner('Private address added')
  })
})

test.describe('edit proposed address', () => {
  const crn = 'X123456'
  const id = 'some-id'

  let caseData: CaseDto
  let proposedAddress: AccommodationDetail
  let initialProposedAddressData: ProposedAddressFormData

  test.beforeEach(async () => {
    caseData = caseFactory.build({ crn })
    initialProposedAddressData = proposedAddressFormFactory
      .manualAddress()
      .build({ id, verificationStatus: 'NOT_CHECKED_YET', nextAccommodationStatus: 'TO_BE_DECIDED' })
    proposedAddress = accommodationFactory.proposed().build({ id, crn, ...initialProposedAddressData })

    await casesApi.stubGetCases([caseData])
    await casesApi.stubGetCaseByCrn(crn, caseData)
    await dutyToReferApi.stubGetAllDutyToReferByCrn(crn, undefined)
    await eligibilityApi.stubGetEligibilityByCrn(crn, undefined)
    await casesApi.stubGetReferralHistory(crn, [])
    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, [proposedAddress])
    await proposedAddressesApi.stubGetProposedAddress(crn, id, proposedAddress)
    await proposedAddressesApi.stubUpdateProposedAddress(crn, id)
  })

  test('should allow user to update address with failed checks', async ({ page }) => {
    const failedStatusFormData = { ...initialProposedAddressData, verificationStatus: 'FAILED' as const }
    const failedStatusUpdate = { ...proposedAddress, verificationStatus: 'FAILED' as const }

    // And I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // And I click the Add checks link for a proposed address
    await profileTrackerPage.clickLink('Add checks')

    // Then I should see the status form page
    const addProposedAddressPage = await AddProposedAddressPage.verifyOnPage(
      page,
      crn,
      'What is the status of the address checks?',
    )

    // Then I should see the populated status form
    await addProposedAddressPage.shouldShowPopulatedStatusForm(initialProposedAddressData)

    // When I click the back link
    await addProposedAddressPage.clickLink('Back')

    // Then I should see the profile tracker page
    await ProfileTrackerPage.verifyOnPage(page, caseData)

    // When I click the Add checks link again
    await profileTrackerPage.clickLink('Add checks')

    // Then I should see the populated status form again
    await addProposedAddressPage.shouldShowPopulatedStatusForm(initialProposedAddressData)

    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, [failedStatusUpdate])

    // When I complete the status form with failed status
    await addProposedAddressPage.completeStatusForm(failedStatusFormData)
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the profile tracker page
    await ProfileTrackerPage.verifyOnPage(page, caseData)

    // And I should see a banner confirming the proposed address was updated
    await profileTrackerPage.shouldShowBanner('Address updated')

    // And the proposed address should show the updated status
    await profileTrackerPage.shouldShowProposedAddresses([failedStatusUpdate])
  })

  test('should allow user to update address with passed checks and confirm next accommodation', async ({ page }) => {
    const confirmedFormData = proposedAddressFormFactory
      .manualAddress()
      .build({ verificationStatus: 'PASSED', nextAccommodationStatus: 'YES' })
    const updatedProposedAddress = accommodationFactory.proposed().build({
      ...confirmedFormData,
      id,
      crn,
      address: addressFactory.minimal().build(confirmedFormData.address),
    })
    const notNextAccommodationUpdate = { ...updatedProposedAddress, nextAccommodationStatus: 'NO' as const }
    const notNextAccommodationFormData = { ...confirmedFormData, nextAccommodationStatus: 'NO' as const }

    // And I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // And I click the Add checks link for a proposed address
    await profileTrackerPage.clickLink('Add checks')

    // Then I should see the status form page
    const addProposedAddressPage = await AddProposedAddressPage.verifyOnPage(
      page,
      crn,
      'What is the status of the address checks?',
    )

    // Then I should see the populated status form
    await addProposedAddressPage.shouldShowPopulatedStatusForm(initialProposedAddressData)

    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, [notNextAccommodationUpdate])

    // When I complete the status form with passed status
    await addProposedAddressPage.completeStatusForm(confirmedFormData)
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the next accommodation form
    await addProposedAddressPage.shouldShowNextAccommodationForm(caseData.name)

    // When I complete the next accommodation form with 'No'
    await addProposedAddressPage.completeNextAccommodationForm(notNextAccommodationFormData)
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the profile tracker page
    await ProfileTrackerPage.verifyOnPage(page, caseData)

    // And I should see a banner confirming the proposed address was updated
    await profileTrackerPage.shouldShowBanner('Address updated')

    // And the proposed address should show passed status
    await profileTrackerPage.shouldShowProposedAddresses([notNextAccommodationUpdate])

    await proposedAddressesApi.stubGetProposedAddress(crn, id, notNextAccommodationUpdate)
    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, [updatedProposedAddress])

    // When I click the Confirm as next address link
    await profileTrackerPage.clickLink('Confirm as next address')

    // Then I should see the populated next accommodation form
    await addProposedAddressPage.shouldShowPopulatedNextAccommodationForm(notNextAccommodationFormData)

    // When I complete the next accommodation form with 'Yes'
    await addProposedAddressPage.completeNextAccommodationForm(confirmedFormData)
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the profile tracker page
    await ProfileTrackerPage.verifyOnPage(page, caseData)

    // And I should see a banner confirming the proposed address was updated
    await profileTrackerPage.shouldShowBanner('Address updated')

    // And the proposed address should show the confirmed status
    await profileTrackerPage.shouldShowProposedAddresses([updatedProposedAddress])
  })
})
