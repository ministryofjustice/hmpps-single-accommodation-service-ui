import { SuperAgentRequest } from 'superagent'
import { TeamDto } from '@sas/api'
import type { ApiResponseDtoUserDto } from '@sas/api'
import { stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'
import { apiResponseFactory } from '../../server/testutils/factories'

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
        jsonBody: apiResponseFactory.buildResponse<ApiResponseDtoUserDto>({
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
