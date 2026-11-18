import type { SuperAgentRequest } from 'superagent'
import { CaseDto as Case } from '@sas/api'
import { GetCasesQuery } from '@sas/ui'
import { queryParameters, stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'
import { apiResponseFactory, caseFactory } from '../../server/testutils/factories'

export default {
  stubGetCustomListCases: (cases: Case[], query: GetCasesQuery): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPathPattern: apiPaths.customList.getCases.pattern,
        queryParameters: queryParameters(query),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.caseList(cases || caseFactory.buildList(2)),
      },
    }),

  stubGetCustomListCrns: (crns: string[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.customList.getList.pattern,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.buildResponse(crns),
      },
    }),

  stubSubmitCustomList: (): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.customList.updateList({}),
      },
      response: {
        status: 200,
      },
    }),
  stubDomainErrorCustomList: (crnList: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.customList.updateList({}),
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
