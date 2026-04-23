import { asUser, AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { ApiResponseDtoAccommodationSummaryDto } from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class AccommodationsClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Accommodations client', config.apis.sasApi, logger, authenticationClient)
  }

  async getCurrentAccommodation(token: string, crn: string) {
    return this.get<ApiResponseDtoAccommodationSummaryDto>(
      {
        path: apiPaths.cases.accommodations.current({ crn }),
      },
      asUser(token),
    )
  }

  async getNextAccommodation(token: string, crn: string) {
    return this.get<ApiResponseDtoAccommodationSummaryDto>(
      {
        path: apiPaths.cases.accommodations.next({ crn }),
      },
      asUser(token),
    )
  }
}
