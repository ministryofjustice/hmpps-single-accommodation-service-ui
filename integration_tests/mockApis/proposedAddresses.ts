import type { SuperAgentRequest } from 'superagent'
import { AccommodationDetail } from '@sas/api'
import { stubApiError, stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'

export default {
  stubGetProposedAddressesByCrn: (crn: string, proposedAddresses?: AccommodationDetail[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.proposedAddresses.index({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: proposedAddresses || [],
      },
    }),
  stubSubmitProposedAddress: (crn: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.cases.proposedAddresses.submit({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),
  stubSubmitProposedAddress500: (crn: string): SuperAgentRequest =>
    stubApiError(apiPaths.cases.proposedAddresses.submit({ crn }), 'POST'),
}
