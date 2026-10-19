import { SuperAgentRequest } from 'superagent'
import { DeliusUserDto, NomisUserDto, Team } from '@sas/api'
import { stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'
import { apiResponseFactory } from '../../server/testutils/factories'

export default {
  stubGetTeams: (teams: Team[] = []): SuperAgentRequest =>
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

  stubGetMe: (
    user: DeliusUserDto | NomisUserDto = { username: 'USER1', teams: [], probationAreaCode: 'N07' },
  ): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: apiPaths.user.me({}),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.buildResponse(user),
      },
    }),
}
