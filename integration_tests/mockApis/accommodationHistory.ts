import { AccommodationSummaryDto } from '@sas/api'
import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'
import { apiResponseFactory } from '../../server/testutils/factories'

export default {
  stubGetAccommodationHistory: (crn: string, accommodations?: AccommodationSummaryDto[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.accommodationHistory({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.accommodationHistory(accommodations || []),
      },
    }),
}
