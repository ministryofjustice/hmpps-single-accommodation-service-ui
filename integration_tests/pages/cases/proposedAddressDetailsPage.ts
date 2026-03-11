import { expect, Page } from '@playwright/test'
import { AccommodationDetail } from '@sas/api'
import { addressLines, formatAddress } from '../../../server/utils/addresses'
import PageWithCaseDetails from './pageWithCaseDetails'
import {
  displayStatus,
  formatProposedAddressArrangement,
  formatProposedAddressNextAccommodation,
  formatProposedAddressSettledType,
  formatProposedAddressStatus,
  proposedAddressStatusTag,
} from '../../../server/utils/proposedAddresses'

export default class ProposedAddressDetailsPage extends PageWithCaseDetails {
  address: string

  constructor(
    page: Page,
    private readonly proposedAddress: AccommodationDetail,
  ) {
    super(page)

    this.address = formatAddress(proposedAddress.address)
    this.header = page.locator('h1', { hasText: this.address })
  }

  async shouldShowProposedAddressSummary() {
    await expect(this.page.getByRole('heading', { name: 'Address details' })).toBeVisible()

    await this.shouldShowSummaryItem('Status', proposedAddressStatusTag(displayStatus(this.proposedAddress)).text)
    await this.shouldShowSummaryItem('Address', addressLines(this.proposedAddress.address))

    const expectedArrangementLines = [
      formatProposedAddressArrangement(this.proposedAddress.arrangementSubType),
      this.proposedAddress.arrangementSubTypeDescription,
      formatProposedAddressSettledType(this.proposedAddress.settledType),
    ]
    await this.shouldShowSummaryItem('Housing arrangement', expectedArrangementLines)

    await this.shouldShowSummaryItem(
      'Address checks',
      formatProposedAddressStatus(this.proposedAddress.verificationStatus),
    )
    if (this.proposedAddress.verificationStatus === 'PASSED') {
      await this.shouldShowSummaryItem(
        'Next address',
        formatProposedAddressNextAccommodation(this.proposedAddress.nextAccommodationStatus),
      )
    }
  }
}
