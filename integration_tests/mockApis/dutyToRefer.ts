import type { SuperAgentRequest } from 'superagent'
import { DutyToReferDto } from '@sas/api'
import { stubFor, stubApiError } from './wiremock'
import { dutyToReferFactory } from '../../server/testutils/factories'
import apiPaths from '../../server/paths/api'

export default {
  stubGetAllDutyToReferByCrn: (crn: string, dutyToReferData?: DutyToReferDto[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.dutyToRefer.index({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: dutyToReferData || dutyToReferFactory.build(),
      },
    }),
  stubGetAllDutyToReferByCrn500: (crn: string): SuperAgentRequest =>
    stubApiError(apiPaths.cases.dutyToRefer.index({ crn })),
  stubGetDutyToReferByCrn: (crn: string, dutyToReferData?: DutyToReferDto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.dutyToRefer.show({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: dutyToReferData || dutyToReferFactory.build(),
      },
    }),
  stubGetDutyToReferByCrn500: (crn: string): SuperAgentRequest =>
    stubApiError(apiPaths.cases.dutyToRefer.show({ crn })),
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
