import type { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetCases: (): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/cases',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            name: 'John Foobar',
          },
        ],
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
