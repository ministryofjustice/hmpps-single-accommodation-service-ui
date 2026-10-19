import { asUser, AuthenticationClient } from '@ministryofjustice/hmpps-rest-client'
import { ApiResponseDtoListAccommodationSummaryDto, ApiResponseDtoAccommodationSummariesDto } from '@sas/api'
import SasApiClient from './sasApiClient'
import apiPaths from '../paths/api'

export default class AccommodationClient extends SasApiClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Accommodation client', authenticationClient)
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
