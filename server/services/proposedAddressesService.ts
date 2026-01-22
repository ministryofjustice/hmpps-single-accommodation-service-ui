import { ProposedAddressDto } from '@sas/api'
import { ProposedAddressesClient } from '../data'

export default class ProposedAddressesService {
  constructor(private readonly proposedAddressesClient: ProposedAddressesClient) {}

  submit(token: string, crn: string, proposedAddressData: ProposedAddressDto) {
    return this.proposedAddressesClient.submit(crn, proposedAddressData)
  }
}
