import { expect, test } from '@playwright/test'
import casesApi from '../../mockApis/cases'
import eligibilityApi from '../../mockApis/eligibility'
import proposedAddressesApi from '../../mockApis/proposedAddresses'
import { login } from '../../testUtils'
import { caseFactory, proposedAddressFormFactory } from '../../../server/testutils/factories'
import ProfileTrackerPage from '../../pages/cases/profileTrackerPage'
import AddProposedAddressPage from '../../pages/cases/addProposedAddressPage'

test.describe('add proposed address', () => {
  test('should allow user to add a new proposed address', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })
    const proposedAddressData = proposedAddressFormFactory.manualAddress().build()

    await casesApi.stubGetCaseByCrn(crn, caseData)
    await eligibilityApi.stubGetEligibilityByCrn(crn)
    await casesApi.stubGetReferralHistory(crn)
    await proposedAddressesApi.stubSubmitProposedAddress(crn)
    await login(page)

    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    await profileTrackerPage.clickAddAddressLink()

    const addProposedAddressPage = await AddProposedAddressPage.verifyOnPage(page)
    await addProposedAddressPage.completeAddressForm(proposedAddressData)
    await addProposedAddressPage.clickContinue()

    await addProposedAddressPage.completeTypeForm(proposedAddressData)
    await addProposedAddressPage.clickContinue()

    await addProposedAddressPage.completeStatusForm(proposedAddressData)
    await addProposedAddressPage.clickContinue()

    await addProposedAddressPage.verifyCheckYourAnswersPage(proposedAddressData, caseData.name)
    await addProposedAddressPage.clickSave()

    await expect(page).toHaveURL(`/cases/${crn}`)
  })

  test('should show error messages when inputs are invalid', async ({ page }) => {
    const crn = 'X123456'
    const caseData = caseFactory.build({ crn })

    await casesApi.stubGetCaseByCrn(crn, caseData)
    await eligibilityApi.stubGetEligibilityByCrn(crn)
    await casesApi.stubGetReferralHistory(crn)
    await login(page)

    const profileTrackerPage = await ProfileTrackerPage.visit(page, caseData)

    await profileTrackerPage.clickAddAddressLink()

    const addProposedAddressPage = await AddProposedAddressPage.verifyOnPage(page)
    await addProposedAddressPage.clickContinue()

    await expect(page.getByText('There is a problem')).toBeVisible()
    await expect(page.locator('#addressLine1-error')).toContainText('Enter address line 1')
    await expect(page.locator('#addressPostcode-error')).toContainText('Enter postcode')
    await expect(page.locator('#addressTown-error')).toContainText('Enter town or city')
    await expect(page.locator('#addressCountry-error')).toContainText('Enter country')
  })
})
