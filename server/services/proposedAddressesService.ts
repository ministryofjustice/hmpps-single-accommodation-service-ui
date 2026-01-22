import { ProposedAddressDto } from '@sas/ui'
import { ProposedAddressesClient } from '../data'

export default class ProposedAddressesService {
  constructor(private readonly proposedAddressesClient: ProposedAddressesClient) {}

  getProposedAddresses(token: string, crn: string) {
    return this.proposedAddressesClient.getProposedAddresses(crn)
  }

  submit(token: string, crn: string, proposedAddressData: ProposedAddressDto) {
    return this.proposedAddressesClient.submit(crn, proposedAddressData)
  }
}
