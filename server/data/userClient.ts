import { asUser } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ApiResponseDtoListTeam, ApiResponseDtoUser } from '@sas/api'
import SasApiClient from './sasApiClient'
import apiPaths from '../paths/api'

export default class UserClient extends SasApiClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('User client', authenticationClient)
  }

  getTeams(token: string) {
    return this.get<ApiResponseDtoListTeam>({ path: apiPaths.user.teams({}) }, asUser(token))
  }

  getMe(token: string) {
    return this.get<ApiResponseDtoUser>({ path: apiPaths.user.me({}) }, asUser(token))
  }
}
