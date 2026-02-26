import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { OsDataHubResponse } from '../../server/utils/osDataHub'

export default {
  stubOsDataHubGetPostcode: (postcode: string, response: OsDataHubResponse): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPathPattern: '/search/places/v1/postcode',
        queryParameters: {
          postcode: { equalTo: postcode },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: response,
      },
    }),
  stubPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),
}
