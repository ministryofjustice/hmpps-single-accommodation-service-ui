import { asUser, AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { ProposedAddressFormData } from '@sas/ui'
import { AccommodationDetail, CreateAccommodationDetail } from '@sas/api'
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

  async submit(token: string, crn: string, proposedAddressData: ProposedAddressFormData) {
    const proposedAddressDetail: CreateAccommodationDetail = {
      ...proposedAddressData,
      arrangementType: 'PRIVATE',
    }

    return this.post<void>(
      {
        path: apiPaths.cases.proposedAddresses.submit({ crn }),
        data: proposedAddressDetail,
      },
      asUser(token),
    )
  }
}
