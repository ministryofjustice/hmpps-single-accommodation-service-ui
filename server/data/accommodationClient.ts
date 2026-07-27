import { asUser, AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { ApiResponseDtoListAccommodationSummaryDto, ApiResponseDtoAccommodationSummariesDto } from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class AccommodationClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Accommodation client', config.apis.sasApi, logger, authenticationClient)
  }

  async getAccommodationHistory(token: string, crn: string) {
    return this.get<ApiResponseDtoListAccommodationSummaryDto>(
      { path: apiPaths.cases.accommodationHistory({ crn }) },
      asUser(token),
    )
  }

  async getAccommodationSummary(token: string, crn: string) {
    return this.get<ApiResponseDtoAccommodationSummariesDto>(
      {
        path: apiPaths.cases.accommodation.summary({ crn }),
      },
      asUser(token),
    )
  }
}
