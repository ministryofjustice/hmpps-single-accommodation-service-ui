import { AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { ProposedAddressDto } from '@sas/api'
import config from '../config'
import logger from '../../logger'
import { ProposedAddressFormData } from '@sas/ui'
import apiPaths from '../paths/api'

export default class ProposedAddressesClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Proposed addresses client', config.apis.sasApi, logger, authenticationClient)
  }

  async submit(crn: string, proposedAddressData: ProposedAddressDto) {
    return this.post<void>({
      path: apiPaths.proposedAddresses.submit({ crn }),
      data: proposedAddressData,
    })
  }
}
