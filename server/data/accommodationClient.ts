import { asUser, AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { ApiResponseDtoListAccommodationSummaryDto, ApiResponseDtoAccommodationSummaryDto } from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class AccommodationClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Accommodation client', config.apis.sasApi, logger, authenticationClient)
  }

  async getCurrentAccommodation(token: string, crn: string) {
    return this.get<ApiResponseDtoAccommodationSummaryDto>(
      {
        path: apiPaths.cases.accommodation.current({ crn }),
      },
      asUser(token),
    )
  }

  async getNextAccommodation(token: string, crn: string) {
    return this.get<ApiResponseDtoAccommodationSummaryDto>(
      {
        path: apiPaths.cases.accommodation.next({ crn }),
      },
      asUser(token),
    )
  }

  async getAccommodationHistory(token: string, crn: string) {
    return this.get<ApiResponseDtoListAccommodationSummaryDto>(
      { path: apiPaths.cases.accommodationHistory({ crn }) },
      asUser(token),
    )
  }
}
