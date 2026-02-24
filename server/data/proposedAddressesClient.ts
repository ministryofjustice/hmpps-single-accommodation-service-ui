import { asUser, AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AccommodationDetail, AccommodationDetailCommand } from '@sas/api'
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

  async getProposedAddress(token: string, crn: string, id: string) {
    return this.get<AccommodationDetail>(
      {
        path: apiPaths.cases.proposedAddresses.show({ crn, id }),
      },
      asUser(token),
    )
  }

  async submit(token: string, crn: string, proposedAddressDetail: AccommodationDetailCommand) {
    return this.post<void>(
      {
        path: apiPaths.cases.proposedAddresses.submit({ crn }),
        data: proposedAddressDetail,
      },
      asUser(token),
    )
  }

  async update(token: string, crn: string, id: string, proposedAddressDetail: AccommodationDetailCommand) {
    return this.put<void>(
      {
        path: apiPaths.cases.proposedAddresses.update({ crn, id }),
        data: proposedAddressDetail,
      },
      asUser(token),
    )
  }
}
