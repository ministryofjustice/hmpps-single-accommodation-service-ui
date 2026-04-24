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
        urlPattern: apiPaths.cases.accommodations.current({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: currentAccommodation ? apiResponseFactory.accommodationSummary(currentAccommodation) : { data: null },
      },
    }),
  stubGetNextAccommodation: (crn: string, nextAccommodation?: AccommodationSummaryDto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.accommodations.next({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: nextAccommodation ? apiResponseFactory.accommodationSummary(nextAccommodation) : { data: null },
      },
    }),
}
