import { SuperAgentRequest } from 'superagent'
import { TeamDto } from '@sas/api'
import { stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'
import { apiResponseFactory } from '../../server/testutils/factories'

export default {
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
