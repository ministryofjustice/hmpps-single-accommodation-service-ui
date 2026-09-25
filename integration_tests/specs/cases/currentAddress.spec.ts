import { Page, test } from '@playwright/test'
import { ProposedAccommodationDto } from '@sas/api'
import proposedAddressesApi from '../../mockApis/proposedAddresses'
import { login } from '../../testUtils'
import {
  accommodationSummariesFactory,
  accommodationSummaryFactory,
  addressFactory,
  caseFactory,
  proposedAccommodationFactory,
} from '../../../server/testutils/factories'
import { stubProfilePage } from '../../helpers/profilePage'
import { stubCaseListPage } from '../../helpers/caseListPage'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import SelectCurrentAddressPage from '../../pages/cases/selectCurrentAddressPage'
import AddCurrentAddressPage from '../../pages/cases/addCurrentAddressPage'
import paths from '../../../server/paths/ui'

const crn = 'X123456'
const caseData = caseFactory.build({ crn })

const proposedAddress = (
  buildingNumber: string,
  thoroughfareName: string,
  verificationStatus: ProposedAccommodationDto['verificationStatus'] = 'PASSED',
) =>
  proposedAccommodationFactory.build({
    crn,
    verificationStatus,
    address: addressFactory
      .minimal()
      .build({ buildingNumber, thoroughfareName, postTown: 'Oxford', postcode: 'OX1 1CD' }),
  })

// Signs in and clicks 'Add a new address' in the current accommodation card
const startJourney = async (page: Page, proposedAddresses: ProposedAccommodationDto[]) => {
  await stubCaseListPage([caseData])
  await stubProfilePage({
    crn,
    caseData,
    proposedAddresses,
    accommodationSummaries: accommodationSummariesFactory.confirmed().build({
      currentAccommodation: accommodationSummaryFactory.current().build({ crn }),
    }),
  })

  for await (const address of proposedAddresses) {
    await proposedAddressesApi.stubSubmitArrival(crn, address.id)
  }

  await login(page)

  const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)
  await profileTrackerPage.clickAddNewCurrentAddress()

  return profileTrackerPage
}

test.describe('change the current address', () => {
  test('should allow the user to set a proposed address as the current address', async ({ page }) => {
    // Given there is a case with proposed addresses, one of which failed its checks
    const firstAddress = proposedAddress('1', 'London Street')
    const secondAddress = proposedAddress('2', 'London Street', 'NOT_CHECKED_YET')
    const failedChecks = proposedAddress('3', 'London Street', 'FAILED')

    // When I start changing the current address
    const profileTrackerPage = await startJourney(page, [secondAddress, firstAddress, failedChecks])

    // Then the addresses should have been requested without the ones that failed their checks
    const selectPage = await SelectCurrentAddressPage.verifyOnPage(page, caseData)
    await selectPage.checkProposedAddressesApiCalledExcludingFailedChecks()

    // And I should see the remaining proposed addresses, A-Z
    await selectPage.shouldShowHint()
    await selectPage.shouldShowProposedAddresses([firstAddress, secondAddress])
    await selectPage.shouldNotShowProposedAddress(failedChecks)

    const backLink = paths.cases.show({ crn })
    await selectPage.shouldShowLink('Back', backLink)
    await selectPage.shouldShowLink('Cancel', backLink)

    // When I select an address and continue
    await selectPage.selectProposedAddress(firstAddress)
    await selectPage.clickButton('Continue')

    // Then an arrival should be created for the selected address
    await selectPage.checkArrivalApiCalled(firstAddress)

    // And I am returned to the profile with a success banner
    await ProfileTrackerPage.verifyOnPage(page, caseData)
    await profileTrackerPage.shouldShowBanner('Current address changed')
  })

  test('should show an error when no address is selected', async ({ page }) => {
    // Given I am changing the current address for a case with a proposed address
    await startJourney(page, [proposedAddress('1', 'London Street')])

    // When I continue without selecting an address
    const selectPage = await SelectCurrentAddressPage.verifyOnPage(page, caseData)
    await selectPage.clickButton('Continue')

    // Then I should see an error
    await SelectCurrentAddressPage.verifyOnPage(page, caseData)
    await selectPage.shouldShowErrorMessagesForFields({ proposedAddressId: 'Select an address' })
  })

  test('should send the user to nDelius when they choose to add a new address', async ({ page }) => {
    // Given I am changing the current address for a case with a proposed address
    await startJourney(page, [proposedAddress('1', 'London Street')])

    // When I select 'Add a new address' and continue
    const selectPage = await SelectCurrentAddressPage.verifyOnPage(page, caseData)
    await selectPage.selectAddANewAddress()
    await selectPage.clickButton('Continue')

    // Then I should see the nDelius page
    const addPage = await AddCurrentAddressPage.verifyOnPage(page, caseData)
    await addPage.shouldShowDeliusLink()
    await addPage.shouldShowLink('Back', paths.currentAddress.select({ crn }))
  })

  test('should send the user straight to nDelius when there are no proposed addresses', async ({ page }) => {
    // Given the only proposed address for the case failed its checks
    // When I start changing the current address
    await startJourney(page, [proposedAddress('3', 'London Street', 'FAILED')])

    // Then I should go straight to the nDelius page
    const addPage = await AddCurrentAddressPage.verifyOnPage(page, caseData)
    await addPage.shouldShowDeliusLink()
    await addPage.shouldShowLink('Back', paths.cases.show({ crn }))
  })
})
