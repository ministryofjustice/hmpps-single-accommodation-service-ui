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
        urlPattern: apiPaths.dutyToRefer({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: dutyToReferData || dutyToReferFactory.build(),
      },
    }),
  stubGetDutyToReferByCrn500: (crn: string): SuperAgentRequest => stubApiError(apiPaths.dutyToRefer({ crn })),
}
