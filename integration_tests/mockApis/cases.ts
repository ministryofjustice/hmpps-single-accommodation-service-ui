import type { SuperAgentRequest } from 'superagent'
import { Case } from '@sas/api'
import { stubFor } from './wiremock'
import { casesResponseFactory } from '../../server/testutils/factories'

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
        jsonBody: casesResponseFactory.build(cases ? { cases } : {}),
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
}
