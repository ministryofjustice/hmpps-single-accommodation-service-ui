import { test } from '@playwright/test'
import { AccommodationDetail } from '@sas/api'
import casesApi from '../../mockApis/cases'
import proposedAddressesApi from '../../mockApis/proposedAddresses'
import dutyToReferApi from '../../mockApis/dutyToRefer'
import eligibilityApi from '../../mockApis/eligibility'
import { login } from '../../testUtils'
import {
  accommodationFactory,
  addressFactory,
  caseFactory,
  proposedAddressFormFactory,
} from '../../../server/testutils/factories'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import AddProposedAddressPage from '../../pages/cases/addProposedAddressPage'

test.describe('add proposed address', () => {
  test('should allow user to add a new proposed address', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })
    const initialProposedAddressData = proposedAddressFormFactory
      .manualAddress()
      .build({ verificationStatus: 'NOT_CHECKED_YET' })
    const updatedProposedAddressData = proposedAddressFormFactory
      .manualAddress()
      .build({ verificationStatus: 'PASSED', nextAccommodationStatus: 'YES' })

    const proposedAddresses = [
      accommodationFactory.proposed().build({ verificationStatus: 'NOT_CHECKED_YET' }),
      accommodationFactory.proposed().build({ verificationStatus: 'FAILED' }),
    ]
    const newProposedAddress = accommodationFactory.proposed().build({
      ...updatedProposedAddressData,
      address: addressFactory.minimal().build(updatedProposedAddressData.address),
    })
    const updatedProposedAddresses: AccommodationDetail[] = [...proposedAddresses, newProposedAddress]

    // Given I have stubbed the API responses
    await casesApi.stubGetCases([caseData])
    await casesApi.stubGetCaseByCrn(crn, caseData)
    await dutyToReferApi.stubGetDutyToReferByCrn(crn, undefined)
    await eligibilityApi.stubGetEligibilityByCrn(crn, undefined)
    await casesApi.stubGetReferralHistory(crn, [])
    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, proposedAddresses)
    await proposedAddressesApi.stubSubmitProposedAddress(crn)

    // And I am logged in
    await login(page)

    // When I visit profile tracker page
    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    // And I click the add an address link
    await profileTrackerPage.clickLink('Add an address')

    // Then I should see the add address form
    const addProposedAddressPage = await AddProposedAddressPage.verifyOnPage(page)

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

    if (initialProposedAddressData.verificationStatus === 'PASSED') {
      // Then I should see the next accommodation form
      await addProposedAddressPage.shouldShowNextAccommodationForm(caseData.name)

      // When I submit the form empty
      await addProposedAddressPage.clickButton('Continue')

      // Then I should see errors
      await addProposedAddressPage.shouldShowErrorMessagesForFields({
        nextAccommodationStatus: 'Select if this is the next address',
      })

      // Then I complete the next accommodation form
      await addProposedAddressPage.completeNextAccommodationForm(initialProposedAddressData)
      await addProposedAddressPage.clickButton('Continue')
    }

    // Then I should see the check your answers page with my entered data
    await addProposedAddressPage.verifyCheckYourAnswersPage(initialProposedAddressData, caseData.name)

    if (initialProposedAddressData.verificationStatus === 'PASSED') {
      // When I click the back link
      await addProposedAddressPage.clickLink('Back')

      // Then I should see the populated next accommodation form
      await addProposedAddressPage.shouldShowPopulatedNextAccommodationForm(initialProposedAddressData)
    }

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

    if (updatedProposedAddressData.verificationStatus === 'PASSED') {
      // And I complete the next accommodation form with new data
      await addProposedAddressPage.completeNextAccommodationForm(updatedProposedAddressData)
      await addProposedAddressPage.clickButton('Continue')
    }

    // Then I should see the check your answers page with my updated data
    await addProposedAddressPage.verifyCheckYourAnswersPage(updatedProposedAddressData, caseData.name)

    // When I submit the proposed address
    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, updatedProposedAddresses)
    await addProposedAddressPage.clickButton('Save')

    // Then the API should have been called with the correct data
    await addProposedAddressPage.checkApiCalled(crn, updatedProposedAddressData)

    // And I should see the proposed addresses on the profile tracker page
    await ProfileTrackerPage.verifyOnPage(page, caseData)
    await profileTrackerPage.shouldShowProposedAddresses(updatedProposedAddresses)
  })
})
