import { expect, Page } from '@playwright/test'
import { CaseDto, ProposedAccommodationDto } from '@sas/api'
import AbstractPage from '../abstractPage'
import { addressLines } from '../../../server/utils/addresses'
import { verifyPost } from '../../mockApis/wiremock'
import apiPaths from '../../../server/paths/api'
import { getTodayLocal } from '../../../server/utils/dates'

export default class ConfirmCurrentAddressPage extends AbstractPage {
  constructor(
    page: Page,
    private readonly caseData: CaseDto,
    private readonly proposedAddress: ProposedAccommodationDto,
  ) {
    super(page)

    this.header = page.locator('h1', { hasText: `Confirm that ${caseData.name} has moved into this address` })
  }

  async shouldShowProposedAddress() {
    const address = this.page.locator('address')

    for await (const line of addressLines(this.proposedAddress.address)) {
      await expect(address).toContainText(line)
    }
  }

  async checkApiCalled() {
    const requestBody = await verifyPost(
      apiPaths.cases.proposedAddresses.arrival({ crn: this.caseData.crn, id: this.proposedAddress.id }),
    )

    expect(requestBody).toEqual({
      arrivalDate: getTodayLocal(),
    })
  }
}
