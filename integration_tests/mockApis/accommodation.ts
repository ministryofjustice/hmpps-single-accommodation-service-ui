import type { SuperAgentRequest } from 'superagent'
import { AccommodationSummariesDto, AccommodationSummaryDto } from '@sas/api'
import { stubApiUpstreamFailure, stubFor } from './wiremock'
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
  stubGetAccommodationSummary: (crn: string, accommodationSummaries?: AccommodationSummariesDto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.accommodation.summary({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.accommodationSummaries(accommodationSummaries),
      },
    }),
  stubGetAccommodationHistoryUpstreamFailure: (crn: string): SuperAgentRequest =>
    stubApiUpstreamFailure(apiPaths.cases.accommodationHistory({ crn })),
}
