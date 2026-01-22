import { AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { ProposedAddressDto } from '@sas/ui'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class ProposedAddressesClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Proposed addresses client', config.apis.sasApi, logger, authenticationClient)
  }

  async getProposedAddresses(crn: string) {
    return this.get<ProposedAddressDto[]>({
      path: apiPaths.cases.proposedAddresses.index({ crn }),
    })
  }

  async submit(crn: string, proposedAddressData: ProposedAddressDto) {
    return this.post<void>({
      path: apiPaths.cases.proposedAddresses.submit({ crn }),
      data: proposedAddressData,
    })
  }
}
