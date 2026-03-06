import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export type LocalAuthority = { id: string; name: string; identifier?: string }

export default class ReferenceDataClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Reference data client', config.apis.sasApi, logger, authenticationClient)
  }

  async getReferenceData(token: string, type: string) {
    return this.get<LocalAuthority[]>(
      {
        path: apiPaths.referenceData({}),
        query: { type },
      }, asUser(token),
    )
  }
}
