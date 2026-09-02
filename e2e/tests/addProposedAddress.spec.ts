import { test } from '../test'
import { signIn } from '../steps/signIn'
import CaseDetailsPage from '../pages/caseDetailsPage'
import AddPropAddressPage from '../pages/addPropAddressPage'
import SelectAddressPage from '../pages/selectAddressPage'
import LivingArrangementPage from '../pages/livingArrangementPage'
import AddressStatusCheckPage from '../pages/addressStatusCheckPage'
import ConfirmAddressPage from '../pages/confirmAddressPage'
import CheckAnswersPage from '../pages/checkAnswersPage'
import ConfirmCurrentAddressPage from '../pages/confirmCurrentAddressPage'
import { ProposedAddressStatus, CurrentAccommodationStatus } from '../data/statuses'
import { getCaseLink } from '../steps/getCaseLink'

test('Can add and confirm a proposed address', async ({
  page,
  users: { probation: probationUser },
  cases: { BASE_CASE },
}) => {
  // GIVEN I sign in as a probation user
  await signIn(page, probationUser)

  // AND I open the relevant case
  const { caseLink } = await getCaseLink(page, BASE_CASE)
  await caseLink.click()

  // AND I define the address used throughout the test
  const propertyNameOrNumber = '40'
  const postcode = 'E4 9JQ'
  const fullAddress = '40 Merriam Close, London, E4 9JQ'

  // WHEN I start adding a proposed address
  const caseDetailsPage = new CaseDetailsPage(page)
  await caseDetailsPage.clickAddProposedAddress()

  // AND I enter the address details
  const addPropAddressPage = new AddPropAddressPage(page)
  await addPropAddressPage.expectPageToBeDisplayed()
  await addPropAddressPage.enterAddress(propertyNameOrNumber, postcode)
  await addPropAddressPage.findAddress()

  // AND I confirm the selected address
  const selectAddressPage = new SelectAddressPage(page)
  await selectAddressPage.expectPageToBeDisplayed()
  await selectAddressPage.continue()

  // AND I select the living arrangement
  const livingArrangementPage = new LivingArrangementPage(page)
  await livingArrangementPage.expectPageToBeDisplayed()
  await livingArrangementPage.selectLivingArrangement('Owner of the property')
  await livingArrangementPage.continue()

  // AND I mark the address checks as passed
  const addressStatusCheckPage = new AddressStatusCheckPage(page)
  await addressStatusCheckPage.expectPageToBeDisplayed()
  await addressStatusCheckPage.selectPassed()
  await addressStatusCheckPage.continue()

  // AND I confirm the address as the next address
  const confirmAddressPage = new ConfirmAddressPage(page)
  await confirmAddressPage.expectPageToBeDisplayed()
  await confirmAddressPage.confirmAddress()
  await confirmAddressPage.continue()

  // THEN I save the proposed address
  const checkAnswersPage = new CheckAnswersPage(page)
  await checkAnswersPage.expectPageToBeDisplayed()
  await checkAnswersPage.save()

  // THEN I should return to the case details page and see the confirmed proposed address
  await caseDetailsPage.expectProposedAddressStatus(fullAddress, ProposedAddressStatus.CONFIRMED)

  // AND I should be able to view the proposed address details
  await caseDetailsPage.expectProposedAddressViewDetailsLink(fullAddress)

  // WHEN I set the proposed address as the current address
  await caseDetailsPage.setProposedAddressAsCurrent(fullAddress)

  // AND I confirm the person has moved into this address
  const confirmCurrentAddressPage = new ConfirmCurrentAddressPage(page)
  await confirmCurrentAddressPage.expectPageToBeDisplayed()
  await confirmCurrentAddressPage.confirmCurrentAddress()

  // THEN I should see the address in Current accommodation
  await caseDetailsPage.expectCurrentAccommodation(
    '40 Merriam Close',
    'London',
    'E4 9JQ',
    CurrentAccommodationStatus.SETTLED,
  )
})
