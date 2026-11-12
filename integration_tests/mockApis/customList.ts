import type { SuperAgentRequest } from 'superagent'
import { CaseDto as Case } from '@sas/api'
import { queryParameters, stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'
import { apiResponseFactory, caseFactory } from '../../server/testutils/factories'
import {GetCasesQuery} from "@sas/ui";

export default {
  stubGetCustomList: (cases: Case[], query: GetCasesQuery): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.customList.pattern,
        queryParameters: queryParameters(query),
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
