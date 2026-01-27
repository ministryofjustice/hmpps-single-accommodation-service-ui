import { asUser, AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { ProposedAddressDto } from '@sas/ui'
import { AccommodationDetail } from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class ProposedAddressesClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Proposed addresses client', config.apis.sasApi, logger, authenticationClient)
  }

  async getProposedAddresses(token: string, crn: string) {
    return this.get<AccommodationDetail[]>(
      {
        path: apiPaths.cases.proposedAddresses.index({ crn }),
      },
      asUser(token),
    )
  }

  async submit(crn: string, proposedAddressData: ProposedAddressDto) {
    return this.post<void>({
      path: apiPaths.cases.proposedAddresses.submit({ crn }),
      data: proposedAddressData,
    })
  }
}
