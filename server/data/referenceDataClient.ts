import { asUser } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ApiResponseDtoListReferenceDataDto } from '@sas/api'
import SasApiClient from './sasApiClient'
import apiPaths from '../paths/api'

export default class ReferenceDataClient extends SasApiClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Reference data client', authenticationClient)
  }

  async getReferenceData(token: string, type: string) {
    return this.get<ApiResponseDtoListReferenceDataDto>(
      {
        path: apiPaths.referenceData({}),
        query: { type },
      },
      asUser(token),
    )
  }
}
