import type { SuperAgentRequest } from 'superagent'
import { CaseDto as Case, AccommodationReferralDto as Referral } from '@sas/api'
import { stubFor } from './wiremock'
import { caseFactory } from '../../server/testutils/factories'

export default {
  stubGetCases: (cases?: Case[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/cases',
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
        urlPattern: '/cases',
      },
      response: {
        status: 500,
      },
    }),
  stubGetCaseByCrn: (crn: string, caseData?: Case): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `/cases/${crn}`,
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
        urlPattern: `/cases/${crn}`,
      },
      response: {
        status: 500,
      },
    }),
  stubGetReferralHistory: (crn: string, referrals?: Referral[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `/application-histories/${crn}`,
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
        urlPattern: `/application-histories/${crn}`,
      },
      response: {
        status: 500,
      },
    }),
}
