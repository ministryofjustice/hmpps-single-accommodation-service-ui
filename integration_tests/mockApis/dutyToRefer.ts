import type { SuperAgentRequest } from 'superagent'
import { DutyToReferDto } from '@sas/api'
import { DutyToReferDto as DutyToReferV2Dto } from '@sas/ui'
import { stubFor, stubApiError } from './wiremock'
import { dutyToReferFactory, dutyToReferV2Factory } from '../../server/testutils/factories'
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
  stubGetAllDutyToReferByCrn500: (crn: string): SuperAgentRequest => stubApiError(apiPaths.cases.dutyToRefer.index({ crn })),
  stubGetDutyToReferByCrn: (crn: string, dutyToReferData?: DutyToReferV2Dto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.dutyToRefer.show({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: dutyToReferData || dutyToReferV2Factory.build(),
      },
    }),
  stubGetDutyToReferByCrn500: (crn: string): SuperAgentRequest => stubApiError(apiPaths.cases.dutyToRefer.show({ crn })),
  stubSubmitDutyToRefer: (crn: string, id: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.cases.dutyToRefer.submit({ crn, id }),
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
