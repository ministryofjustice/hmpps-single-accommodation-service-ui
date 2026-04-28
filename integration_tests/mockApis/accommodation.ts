import type { SuperAgentRequest } from 'superagent'
import { AccommodationSummaryDto } from '@sas/api'
import { stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'
import { apiResponseFactory } from '../../server/testutils/factories'

export default {
  stubGetCurrentAccommodation: (crn: string, currentAccommodation?: AccommodationSummaryDto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.accommodation.current({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.accommodationSummary(currentAccommodation),
      },
    }),
  stubGetNextAccommodation: (crn: string, nextAccommodation?: AccommodationSummaryDto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.accommodation.next({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.accommodationSummary(nextAccommodation),
      },
    }),
}
