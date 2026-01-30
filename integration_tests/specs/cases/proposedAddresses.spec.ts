import { expect, test } from '@playwright/test'
import { AccommodationDetail } from '@sas/api'
import casesApi from '../../mockApis/cases'
import proposedAddressesApi from '../../mockApis/proposedAddresses'
import { login } from '../../testUtils'
import { accommodationFactory, caseFactory, proposedAddressFormFactory } from '../../../server/testutils/factories'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import AddProposedAddressPage from '../../pages/cases/addProposedAddressPage'

test.describe('add proposed address', () => {
  test('should allow user to add a new proposed address', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })
    const proposedAddressData = proposedAddressFormFactory.manualAddress().build()
    const proposedAddresses = [
      accommodationFactory.proposed().build({ status: 'NOT_CHECKED_YET' }),
      accommodationFactory.proposed().build({ status: 'CHECKS_FAILED' }),
    ]
    const newProposedAddress = accommodationFactory.proposed().build({
      ...proposedAddressData,
    })
    const updatedProposedAddresses: AccommodationDetail[] = [...proposedAddresses, newProposedAddress]

    await casesApi.stubGetCases([caseData])
    await casesApi.stubGetCaseByCrn(crn, caseData)
    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, proposedAddresses)
    await proposedAddressesApi.stubSubmitProposedAddress(crn)
    await login(page)

    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)
    await profileTrackerPage.shouldShowProposedAddresses(proposedAddresses)
    await profileTrackerPage.clickAddAddressLink()

    const addProposedAddressPage = await AddProposedAddressPage.verifyOnPage(page)
    await addProposedAddressPage.completeAddressForm(proposedAddressData)
    await addProposedAddressPage.clickContinue()

    await addProposedAddressPage.completeTypeForm(proposedAddressData)
    await addProposedAddressPage.clickContinue()

    await addProposedAddressPage.completeStatusForm(proposedAddressData)
    await addProposedAddressPage.clickContinue()

    await addProposedAddressPage.verifyCheckYourAnswersPage(proposedAddressData, caseData.name)

    await proposedAddressesApi.stubGetProposedAddressesByCrn(crn, updatedProposedAddresses)
    await addProposedAddressPage.clickSave()

    await ProfileTrackerPage.verifyOnPage(page, caseData)
    await profileTrackerPage.shouldShowProposedAddresses(updatedProposedAddresses)
  })

  test('should show error messages when inputs are invalid', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })

    await casesApi.stubGetCases([caseData])
    await casesApi.stubGetCaseByCrn(crn, caseData)
    await login(page)

    const addProposedAddressPage = await AddProposedAddressPage.visit(page, caseData)
    await addProposedAddressPage.clickContinue()

    await expect(page.getByText('There is a problem')).toBeVisible()
    await expect(page.locator('#addressLine1-error')).toContainText('Enter address line 1')
    await expect(page.locator('#addressPostcode-error')).toContainText('Enter postcode')
    await expect(page.locator('#addressTown-error')).toContainText('Enter town or city')
    await expect(page.locator('#addressCountry-error')).toContainText('Enter country')
  })
})
