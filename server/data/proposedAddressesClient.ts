import { asUser, AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import {
  ApiResponseDtoListAuditRecordDto,
  ApiResponseDtoListProposedAccommodationDto,
  ApiResponseDtoProposedAccommodationDto,
  NoteCommand,
  ProposedAccommodationDetailCommand,
} from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class ProposedAddressesClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Proposed addresses client', config.apis.sasApi, logger, authenticationClient)
  }

  async getProposedAddresses(token: string, crn: string) {
    return this.get<ApiResponseDtoListProposedAccommodationDto>(
      {
        path: apiPaths.cases.proposedAddresses.index({ crn }),
      },
      asUser(token),
    )
  }

  async getProposedAddress(token: string, crn: string, id: string) {
    return this.get<ApiResponseDtoProposedAccommodationDto>(
      {
        path: apiPaths.cases.proposedAddresses.show({ crn, id }),
      },
      asUser(token),
    )
  }

  async submit(token: string, crn: string, proposedAddressDetail: ProposedAccommodationDetailCommand) {
    return this.post<void>(
      {
        path: apiPaths.cases.proposedAddresses.submit({ crn }),
        data: proposedAddressDetail,
      },
      asUser(token),
    )
  }

  async update(token: string, crn: string, id: string, proposedAddressDetail: ProposedAccommodationDetailCommand) {
    return this.put<void>(
      {
        path: apiPaths.cases.proposedAddresses.update({ crn, id }),
        data: proposedAddressDetail,
      },
      asUser(token),
    )
  }

  async getTimeline(token: string, crn: string, id: string) {
    return this.get<ApiResponseDtoListAuditRecordDto>(
      { path: apiPaths.cases.proposedAddresses.timeline({ crn, id }) },
      asUser(token),
    )
  }

  async submitTimelineNote(token: string, crn: string, id: string, note: NoteCommand) {
    return this.post<void>(
      {
        path: apiPaths.cases.proposedAddresses.notes({ crn, id }),
        data: note,
      },
      asUser(token),
    )
  }
}
