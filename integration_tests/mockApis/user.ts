import { SuperAgentRequest } from 'superagent'
import { TeamDto } from '@sas/api'
import { stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'
import { apiResponseFactory } from '../../server/testutils/factories'
import type { UserProfileResponse } from '../../server/interfaces/userProfile'

export default {
  stubGetMe: (probationAreaCode = 'London', teams: TeamDto[] = []): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: apiPaths.user.me({}),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.buildResponse<UserProfileResponse>({
          userType: 'DELIUS',
          username: 'user1',
          deliusUserDetails: { teams, probationAreaCode },
        }),
      },
    }),
  stubGetTeams: (teams: TeamDto[] = []): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: apiPaths.user.teams({}),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.buildResponse(teams),
      },
    }),
}
