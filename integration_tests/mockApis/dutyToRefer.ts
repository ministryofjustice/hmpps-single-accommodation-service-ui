import type { SuperAgentRequest } from 'superagent'
import { DutyToReferDto } from '@sas/api'
import { stubFor, stubApiError } from './wiremock'
import { dutyToReferFactory } from '../../server/testutils/factories'
import apiPaths from '../../server/paths/api'

export default {
  stubGetDutyToReferByCrn: (crn: string, dutyToReferData?: DutyToReferDto[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.dutyToRefer({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: dutyToReferData || dutyToReferFactory.buildList(1),
      },
    }),
  stubGetDutyToReferByCrn500: (crn: string): SuperAgentRequest => stubApiError(apiPaths.cases.dutyToRefer({ crn })),
}
