import { ProposedAddressFormData } from '@sas/ui'
import { AccommodationDetail } from '@sas/api'
import { ProposedAddressesClient } from '../data'

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

  submit(token: string, crn: string, proposedAddressData: ProposedAddressFormData) {
    return this.proposedAddressesClient.submit(crn, proposedAddressData)
  }
}
