import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ApiResponseDtoListTeam } from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class UserClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('User client', config.apis.sasApi, logger, authenticationClient)
  }

  getTeams(token: string) {
    return this.get<ApiResponseDtoListTeam>({ path: apiPaths.user.teams({}) }, asUser(token))
  }
}
