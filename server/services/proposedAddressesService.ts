import { ProposedAddressFormData } from '@sas/ui'
import { AccommodationDetail } from '@sas/api'
import { ProposedAddressesClient } from '../data'
import { proposedAddressFormDataToRequestBody } from '../utils/proposedAddresses'

export default class ProposedAddressesService {
  constructor(private readonly proposedAddressesClient: ProposedAddressesClient) {}

  async getProposedAddresses(
    token: string,
    crn: string,
  ): Promise<{ proposed: AccommodationDetail[]; failedChecks: AccommodationDetail[] }> {
    const allProposedAddresses = await this.proposedAddressesClient.getProposedAddresses(token, crn)

    return {
      proposed: allProposedAddresses.filter(address => address.verificationStatus !== 'FAILED'),
      failedChecks: allProposedAddresses.filter(address => address.verificationStatus === 'FAILED'),
    }
  }

  async getProposedAddress(token: string, crn: string, id: string): Promise<AccommodationDetail> {
    return this.proposedAddressesClient.getProposedAddress(token, crn, id)
  }

  submit(token: string, crn: string, proposedAddressData: ProposedAddressFormData) {
    return this.proposedAddressesClient.submit(token, crn, proposedAddressFormDataToRequestBody(proposedAddressData))
  }

  update(token: string, crn: string, proposedAddressData: ProposedAddressFormData) {
    return this.proposedAddressesClient.update(
      token,
      crn,
      proposedAddressData.id,
      proposedAddressFormDataToRequestBody(proposedAddressData),
    )
  }
}
