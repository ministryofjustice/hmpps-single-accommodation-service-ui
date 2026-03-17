import { RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ReferenceDataDto } from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class ReferenceDataClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Reference data client', config.apis.sasApi, logger, authenticationClient)
  }

  async getReferenceData(type: string) {
    return this.get<ReferenceDataDto[]>({
      path: apiPaths.referenceData({}),
      query: { type },
    })
  }
}
