import { test } from '@playwright/test'
import { AuditRecordDto, CaseDto, ProposedAccommodationDto } from '@sas/api'
import { ProposedAddressFormData } from '@sas/ui'
import { faker } from '@faker-js/faker'
import accommodationApi from '../../mockApis/accommodation'
import casesApi from '../../mockApis/cases'
import proposedAddressesApi from '../../mockApis/proposedAddresses'
import eligibilityApi from '../../mockApis/eligibility'
import osDataHubApi from '../../mockApis/osDataHubApi'
import referenceDataApi from '../../mockApis/referenceData'
import { login } from '../../testUtils'
import {
  addressFactory,
  auditRecordFactory,
  caseFactory,
  proposedAccommodationFactory,
  proposedAddressFormFactory,
} from '../../../server/testutils/factories'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import AddProposedAddressPage from '../../pages/cases/addProposedAddressPage'
import osDataHubApiResponse from '../../../server/testutils/fixtures/osDataHubApi/getPostcode.json'
import { resultToAddressDetails } from '../../../server/utils/osDataHub'
import { formatAddress } from '../../../server/utils/addresses'
import ProposedAddressDetailsPage from '../../pages/cases/proposedAddressDetailsPage'
import { addressTimelineEntry } from '../../../server/utils/proposedAddresses'
import { accommodationTypes } from '../../../server/testutils/factories/proposedAccommodation'

const setupCase = async () => {
  const caseData = caseFactory.build()
  const { crn } = caseData

  await casesApi.stubGetCases([caseData])
  await casesApi.stubGetCaseByCrn(crn, caseData)
  await eligibilityApi.stubGetEligibilityByCrn(crn, undefined)
  await casesApi.stubGetReferralHistory(crn, [])
  await accommodationApi.stubGetCurrentAccommodation(crn, undefined)
  await accommodationApi.stubGetNextAccommodation(crn, undefined)
  await accommodationApi.stubGetAccommodationHistory(crn, [])
  await referenceDataApi.stubGetAccommodationTypes()

  return caseData
}

const setupProposedAddresses = async (crn: string, proposedAddresses: ProposedAccommodationDto[] = []) => {
  await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, proposedAddresses)
  await proposedAddressesApi.stubSubmitProposedAddress(crn)

  for await (const proposedAddress of proposedAddresses) {
    await proposedAddressesApi.stubGetProposedAddress(crn, proposedAddress.id, proposedAddress)
    await proposedAddressesApi.stubGetProposedAddressTimeline(crn, proposedAddress.id, [
      auditRecordFactory.proposedAddressCreated(proposedAddress).build(),
    ])
    await proposedAddressesApi.stubUpdateProposedAddress(crn, proposedAddress.id)
  }
}

const setupProposedAddressTimeline = async (crn: string, addressId: string, records: AuditRecordDto[]) => {
  await proposedAddressesApi.stubGetProposedAddressTimeline(crn, addressId, records)
}

test.describe('view proposed address details', () => {
  test('should allow user to view the details of a proposed address', async ({ page }) => {
    const caseData = await setupCase()
    const proposedAddress = proposedAccommodationFactory.build({
      crn: caseData.crn,
      verificationStatus: 'NOT_CHECKED_YET',
    })
    const createdAddressRecord = auditRecordFactory.proposedAddressCreated(proposedAddress).build()
    await setupProposedAddresses(caseData.crn, [proposedAddress])
    const noteAddressRecord = auditRecordFactory.note('This is a note\n\nWith line breaks').build()
    await setupProposedAddressTimeline(caseData.crn, proposedAddress.id, [createdAddressRecord])

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

    // And I should see a timeline entry showing when the address was created
    await addressDetailsPage.shouldShowTimelineEntry(addressTimelineEntry(createdAddressRecord))

    // When I click the button to add a note
    await addressDetailsPage.clickButton('Add note')

    // Then I should see an error
    await addressDetailsPage.shouldShowErrorMessagesForFields({
      note: 'Enter a note',
    })

    // When I enter a note and submit
    await proposedAddressesApi.stubSubmitProposedAddressTimelineNote(caseData.crn, proposedAddress.id)
    await proposedAddressesApi.stubGetProposedAddressTimeline(caseData.crn, proposedAddress.id, [
      noteAddressRecord,
      createdAddressRecord,
    ])
    await addressDetailsPage.completeInputByLabel('Add note', 'This is a note\n\nWith line breaks')
    await addressDetailsPage.clickButton('Add note')

    // Then I should see a success banner
    await addressDetailsPage.shouldShowBanner('Note added')

    // And the note should be shown in the timeline at the top
    await addressDetailsPage.shouldShowTimelineEntry(addressTimelineEntry(noteAddressRecord), 0)
  })
})

test.describe('add proposed address', () => {
  let caseData: CaseDto
  let crn: string

  test.beforeEach(async () => {
    // Given there is data for the given case
    caseData = await setupCase()
    crn = caseData.crn
    await setupProposedAddresses(crn, [])
  })

  test('should allow user to add a new proposed address entered manually', async ({ page }) => {
    const initialProposedAddressData = proposedAddressFormFactory
      .manualAddress()
      .build({ verificationStatus: 'NOT_CHECKED_YET' })
    const updatedProposedAddressData = proposedAddressFormFactory
      .manualAddress()
      .build({ verificationStatus: 'PASSED', nextAccommodationStatus: 'YES' })

    const newProposedAddress = proposedAccommodationFactory.build({
      ...updatedProposedAddressData,
      crn,
      // address: addressFactory.minimal().build(updatedProposedAddressData.address),
    })
    const proposedAddresses: ProposedAccommodationDto[] = [newProposedAddress]

    // Given I am logged in
    await login(page)

    // When I visit the profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // And I click the add a proposed address link
    await profileTrackerPage.clickLink('Add a proposed address')

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

    // Then I should see an error
    await addProposedAddressPage.shouldShowErrorMessagesForFields({
      accommodationTypeCode: 'Select an accommodation type',
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

    // Then I should see the check your answers page with my updated data
    await addProposedAddressPage.verifyCheckYourAnswersPage(
      { ...initialProposedAddressData, address: updatedProposedAddressData.address },
      caseData.name,
    )

    // When I click to change the type
    await addProposedAddressPage.clickChangeLink(
      `Which best describes the living arrangement for ${caseData.name} at this address?`,
    )
    await addProposedAddressPage.completeTypeForm(updatedProposedAddressData)
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the check your answers page with my updated data
    await addProposedAddressPage.verifyCheckYourAnswersPage(
      {
        ...initialProposedAddressData,
        accommodationTypeCode: updatedProposedAddressData.accommodationTypeCode,
        address: updatedProposedAddressData.address,
      },
      caseData.name,
    )

    // When I click to change the status checks
    await addProposedAddressPage.clickChangeLink('What is the status of the address checks?')
    await addProposedAddressPage.completeStatusForm(updatedProposedAddressData)
    await addProposedAddressPage.clickButton('Continue')

    // And I complete the next accommodation form with new data
    await addProposedAddressPage.completeNextAccommodationForm(updatedProposedAddressData)
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the check your answers page with my updated data
    await addProposedAddressPage.verifyCheckYourAnswersPage(updatedProposedAddressData, caseData.name)

    // When I submit the proposed address
    await setupProposedAddresses(crn, proposedAddresses)
    await addProposedAddressPage.clickButton('Save')

    // Then the API should have been called with the correct data
    await addProposedAddressPage.checkApiCalled(crn, updatedProposedAddressData)

    // And I see the profile tracker page
    await ProfileTrackerPage.verifyOnPage(page, caseData)

    // And I should see a success banner confirming the proposed address was added
    await profileTrackerPage.shouldShowBanner('Private address added')

    // And the new proposed address should be shown in the proposed addresses section
    await profileTrackerPage.shouldShowProposedAddresses(proposedAddresses)
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

    // And I click the add a proposed address link
    await profileTrackerPage.clickLink('Add a proposed address')

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
    const newProposedAddress = proposedAccommodationFactory.build(submittedAddress)
    await setupProposedAddresses(crn, [newProposedAddress])
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
  const id = 'some-id'

  let crn: string
  let caseData: CaseDto
  let initialProposedAddressData: ProposedAddressFormData
  let proposedAddress: ProposedAccommodationDto
  let createdAddressRecord: AuditRecordDto

  test.beforeEach(async () => {
    caseData = await setupCase()
    crn = caseData.crn
    initialProposedAddressData = proposedAddressFormFactory
      .manualAddress()
      .build({ id, verificationStatus: 'NOT_CHECKED_YET', nextAccommodationStatus: 'TO_BE_DECIDED' })
    proposedAddress = proposedAccommodationFactory.build({ id, crn, ...initialProposedAddressData })
    createdAddressRecord = auditRecordFactory.proposedAddressCreated(proposedAddress).build()

    await setupProposedAddresses(crn, [proposedAddress])
    await setupProposedAddressTimeline(crn, id, [createdAddressRecord])
  })

  test('should allow user to add checks to a proposed address', async ({ page }) => {
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

    await setupProposedAddresses(crn, [failedStatusUpdate])

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

  test('should allow user to confirm a proposed address as next accommodation', async ({ page }) => {
    const confirmedFormData = proposedAddressFormFactory
      .manualAddress()
      .build({ verificationStatus: 'PASSED', nextAccommodationStatus: 'YES' })
    const updatedProposedAddress = proposedAccommodationFactory.build({
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

    await setupProposedAddresses(crn, [notNextAccommodationUpdate])

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

    // When I click the Confirm as next address link
    await profileTrackerPage.clickLink('Confirm as next address')

    // Then I should see the populated next accommodation form
    await addProposedAddressPage.shouldShowPopulatedNextAccommodationForm(notNextAccommodationFormData)

    // When I complete the next accommodation form with 'Yes'
    await setupProposedAddresses(crn, [updatedProposedAddress])
    await addProposedAddressPage.completeNextAccommodationForm(confirmedFormData)
    await addProposedAddressPage.clickButton('Continue')

    // Then I should see the profile tracker page
    await ProfileTrackerPage.verifyOnPage(page, caseData)

    // And I should see a banner confirming the proposed address was updated
    await profileTrackerPage.shouldShowBanner('Address updated')

    // And the proposed address should show the confirmed status
    await profileTrackerPage.shouldShowProposedAddresses([updatedProposedAddress])
  })

  test('should allow the user to change details of an existing proposed address', async ({ page }) => {
    const updatedProposedAddress = proposedAccommodationFactory.build({
      ...proposedAddress,
      accommodationType: faker.helpers.arrayElement(
        accommodationTypes.filter(type => type.code !== proposedAddress.accommodationType.code),
      ),
    })
    const checksPassedProposedAddress = proposedAccommodationFactory.build({
      ...updatedProposedAddress,
      verificationStatus: 'PASSED',
      nextAccommodationStatus: 'TO_BE_DECIDED',
    })

    // Given I am logged in
    await login(page)

    // When I visit a profile tracker page with a proposed address
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // When I click the link to view address details in the proposed address card
    await profileTrackerPage.clickLink('Notes', profileTrackerPage.getCard(formatAddress(proposedAddress.address)))

    // Then I should see the address details page
    const addressDetailsPage = await ProposedAddressDetailsPage.verifyOnPage(page, proposedAddress)

    // When I click the Change arrangement type link
    await addressDetailsPage.clickChangeLink('Housing arrangement')

    // Then I should see the populated type form
    const editProposedAddressPage = await AddProposedAddressPage.verifyOnPage(
      page,
      crn,
      `Which best describes the living arrangement for ${caseData.name} at this address?`,
    )
    await editProposedAddressPage.shouldShowPopulatedTypeForm({
      ...proposedAddress,
      accommodationTypeCode: proposedAddress.accommodationType.code,
    })

    // When I update the arrangement type
    const updatedAddressRecord = auditRecordFactory
      .proposedAddressUpdated([
        {
          field: 'accommodationTypeDescription',
          value: updatedProposedAddress.accommodationType.description,
        },
      ])
      .build()
    await setupProposedAddresses(crn, [updatedProposedAddress])
    await setupProposedAddressTimeline(crn, updatedProposedAddress.id, [updatedAddressRecord, createdAddressRecord])
    await editProposedAddressPage.completeTypeForm({
      ...updatedProposedAddress,
      accommodationTypeCode: updatedProposedAddress.accommodationType.code,
    })
    await editProposedAddressPage.clickButton('Continue')

    // Then I should see the address details page
    const updatedAddressDetailsPage = await ProposedAddressDetailsPage.verifyOnPage(page, updatedProposedAddress)

    // And a banner should be shown confirming the proposed address was updated
    await updatedAddressDetailsPage.shouldShowBanner('Address updated')

    // And the address details should be updated
    await updatedAddressDetailsPage.shouldShowProposedAddressSummary()

    // And a timeline entry should be shown
    await updatedAddressDetailsPage.shouldShowTimelineEntry(addressTimelineEntry(updatedAddressRecord))

    // When I click the Change address checks link
    await updatedAddressDetailsPage.clickChangeLink('Address checks')

    // And I update the address checks
    const checksPassedAddressRecord = auditRecordFactory
      .proposedAddressUpdated([
        {
          field: 'verificationStatus',
          value: checksPassedProposedAddress.verificationStatus,
        },
        {
          field: 'nextAccommodationStatus',
          value: checksPassedProposedAddress.nextAccommodationStatus,
        },
      ])
      .build()
    await setupProposedAddresses(crn, [checksPassedProposedAddress])
    await setupProposedAddressTimeline(crn, updatedProposedAddress.id, [
      checksPassedAddressRecord,
      updatedAddressRecord,
      createdAddressRecord,
    ])
    await editProposedAddressPage.completeStatusForm(checksPassedProposedAddress)
    await editProposedAddressPage.clickButton('Continue')
    await editProposedAddressPage.completeNextAccommodationForm(checksPassedProposedAddress)
    await editProposedAddressPage.clickButton('Continue')

    // Then I should see the address details page
    const checksPassedAddressDetailsPage = await ProposedAddressDetailsPage.verifyOnPage(
      page,
      checksPassedProposedAddress,
    )

    // And a banner should be shown confirming the proposed address was updated
    await checksPassedAddressDetailsPage.shouldShowBanner('Address updated')

    // And the address details should be updated
    await checksPassedAddressDetailsPage.shouldShowProposedAddressSummary()

    // And a timeline entry should be shown
    await checksPassedAddressDetailsPage.shouldShowTimelineEntry(addressTimelineEntry(checksPassedAddressRecord))
  })
})
