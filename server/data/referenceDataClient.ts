import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ApiResponseDtoListReferenceDataDto } from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class ReferenceDataClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Reference data client', config.apis.sasApi, logger, authenticationClient)
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
