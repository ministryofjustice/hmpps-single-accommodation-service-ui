import { expect, Page } from '@playwright/test'
import { CaseDto, ProposedAccommodationDto } from '@sas/api'
import AbstractPage from '../abstractPage'
import { addressLines } from '../../../server/utils/addresses'
import { NEW_ADDRESS_OPTION, sortAddressesAlphabetically } from '../../../server/utils/currentAddress'
import { displayName } from '../../../server/utils/cases'
import { getMatchingRequests, verifyPost } from '../../mockApis/wiremock'
import apiPaths from '../../../server/paths/api'
import { getTodayLocal } from '../../../server/utils/dates'

export default class SelectCurrentAddressPage extends AbstractPage {
  constructor(
    page: Page,
    private readonly caseData: CaseDto,
  ) {
    super(page)

    this.header = page.locator('h1', { hasText: `What is the new current address for ${displayName(caseData)}?` })
  }

  private radio(proposedAddressId: string) {
    return this.page.locator(`input[name="proposedAddressId"][value="${proposedAddressId}"]`)
  }

  async shouldShowHint() {
    await expect(this.page.locator('#proposedAddressId-hint')).toHaveText(
      'Addresses that have previously failed checks will not show here.',
    )
  }

  async shouldShowProposedAddresses(proposedAddresses: ProposedAccommodationDto[]) {
    const sortedAddresses = sortAddressesAlphabetically(proposedAddresses)
    const radioValues = await this.page
      .locator('input[name="proposedAddressId"]')
      .evaluateAll(radios => radios.map(radio => (radio as HTMLInputElement).value))

    expect(radioValues).toEqual([...sortedAddresses.map(address => address.id), NEW_ADDRESS_OPTION])

    for await (const address of sortedAddresses) {
      const label = this.page.locator(`label[for="${await this.radio(address.id).getAttribute('id')}"]`)

      for await (const line of addressLines(address.address)) {
        await expect(label).toContainText(line)
      }
    }

    await expect(this.page.getByRole('radio', { name: 'Add a new address' })).toBeVisible()
  }

  async shouldNotShowProposedAddress(proposedAddress: ProposedAccommodationDto) {
    await expect(this.radio(proposedAddress.id)).toHaveCount(0)
  }

  async selectProposedAddress(proposedAddress: ProposedAccommodationDto) {
    await this.radio(proposedAddress.id).check()
  }

  async selectAddANewAddress() {
    await this.page.getByRole('radio', { name: 'Add a new address' }).check()
  }

  async checkProposedAddressesApiCalledExcludingFailedChecks() {
    const { body } = await getMatchingRequests({
      method: 'GET',
      urlPath: apiPaths.cases.proposedAddresses.index({ crn: this.caseData.crn }),
      queryParameters: { excludeVerificationFailed: { equalTo: 'true' } },
    })

    expect(body.requests).not.toHaveLength(0)
  }

  async checkArrivalApiCalled(proposedAddress: ProposedAccommodationDto) {
    const requestBody = await verifyPost(
      apiPaths.cases.proposedAddresses.arrival({ crn: this.caseData.crn, id: proposedAddress.id }),
    )

    expect(requestBody).toEqual({ arrivalDate: getTodayLocal() })
  }
}
