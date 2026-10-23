import type { SuperAgentRequest } from 'superagent'
import { CaseDto as Case } from '@sas/api'
import { stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'
import { apiResponseFactory, caseFactory } from '../../server/testutils/factories'

export default {
  stubGetCustomList: (cases?: Case[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.customList({}),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.caseList(cases || caseFactory.buildList(2)),
      },
    }),

  stubSubmitCustomList: (): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.customList({}),
      },
      response: {
        status: 200,
      },
    }),
  stubDomainErrorCustomList: (crnList: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.customList({}),
      },
      response: {
        status: 400,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: 400,
          errorCode: 'invalidCrns',
          userMessage: crnList,
          developerMessage: 'Domain Exception: Invalid CRNs',
        },
      },
    }),
}
