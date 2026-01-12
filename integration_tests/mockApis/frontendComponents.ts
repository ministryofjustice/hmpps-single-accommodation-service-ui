import type { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubComponents: (): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: '/api/components',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {},
      },
    }),

  stubPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: '/health/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),
}
