import type { SuperAgentRequest } from 'superagent'
import { DutyToReferDto } from '@sas/api'
import { stubFor, stubApiError } from './wiremock'
import { dutyToReferFactory } from '../../server/testutils/factories'
import apiPaths from '../../server/paths/api'

export default {
  stubGetCurrentDtr: (crn: string, dutyToReferData?: DutyToReferDto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.dutyToRefer.current({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: dutyToReferData || dutyToReferFactory.build(),
      },
    }),
  stubGetCurrentDtr500: (crn: string): SuperAgentRequest => stubApiError(apiPaths.cases.dutyToRefer.current({ crn })),
  stubGetDtrBySubmissionId: (crn: string, submissionId: string, dutyToReferData?: DutyToReferDto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.dutyToRefer.show({ crn, id: submissionId }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: dutyToReferData || dutyToReferFactory.submitted().build(),
      },
    }),
  stubSubmitDutyToRefer: (crn: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.cases.dutyToRefer.submit({ crn }),
      },
      response: {
        status: 200,
      },
    }),
  stubUpdateDutyToRefer: (crn: string, id: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'PUT',
        urlPattern: apiPaths.cases.dutyToRefer.update({ crn, id }),
      },
      response: {
        status: 200,
      },
    }),
}
