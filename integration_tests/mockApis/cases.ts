import type { SuperAgentRequest } from 'superagent'
import { CaseDto as Case, AccommodationReferralDto as Referral } from '@sas/api'
import { GetCasesQuery } from '@sas/ui'
import { queryParameters, stubApiError, stubFor } from './wiremock'
import { caseFactory } from '../../server/testutils/factories'
import apiPaths from '../../server/paths/api'

export default {
  stubGetCases: (cases?: Case[], query?: GetCasesQuery): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPathPattern: apiPaths.cases.index.pattern,
        queryParameters: queryParameters(query),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: cases || caseFactory.buildList(5),
      },
    }),
  stubGetCases500: (): SuperAgentRequest => stubApiError(apiPaths.cases.index({})),
  stubGetCaseByCrn: (crn: string, caseData?: Case): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.show({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: caseData || caseFactory.build({ crn }),
      },
    }),
  stubGetCaseByCrn500: (crn: string): SuperAgentRequest => stubApiError(apiPaths.cases.show({ crn })),
  stubGetReferralHistory: (crn: string, referrals?: Referral[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.referrals({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: referrals || [],
      },
    }),
  stubGetReferralHistory500: (crn: string): SuperAgentRequest => stubApiError(apiPaths.cases.referrals({ crn })),
}
