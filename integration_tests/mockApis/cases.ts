import type { SuperAgentRequest } from 'superagent'
import { AccommodationReferralDto as Referral } from '@sas/api'
import { stubFor } from './wiremock'
import { caseFactory } from '../../server/testutils/factories'
import apiPaths from '../../server/paths/api'
import { Case } from '../../server/data/casesClient'

export default {
  stubGetCases: (cases?: Case[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.index({}),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: cases || caseFactory.buildList(5),
      },
    }),
  stubGetCases500: (): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.index({}),
      },
      response: {
        status: 500,
      },
    }),
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
  stubGetCaseByCrn500: (crn: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.show({ crn }),
      },
      response: {
        status: 500,
      },
    }),
  stubGetReferralHistory: (crn: string, referrals?: Referral[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.referrals.history({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: referrals || [],
      },
    }),
  stubGetReferralHistory500: (crn: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.referrals.history({ crn }),
      },
      response: {
        status: 500,
      },
    }),
}
