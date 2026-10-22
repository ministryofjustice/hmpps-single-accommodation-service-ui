import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ApiResponseDtoListTeamDto } from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'
import type { UserProfileResponse } from '../interfaces/userProfile'

export default class UserClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('User client', config.apis.sasApi, logger, authenticationClient)
  }

  getTeams(token: string) {
    return this.get<ApiResponseDtoListTeamDto>({ path: apiPaths.user.teams({}) }, asUser(token))
  }

  getMe(token: string) {
    return this.get<UserProfileResponse>({ path: apiPaths.user.me({}) }, asUser(token))
  }
}
