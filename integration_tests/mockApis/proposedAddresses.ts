import { SuperAgentRequest } from 'superagent'
import { stubApiError, stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'

export default {
  stubSubmitProposedAddress: (crn: string) => {
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.proposedAddresses.submit({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubSubmitProposedAddress500: (crn: string): SuperAgentRequest =>
    stubApiError(apiPaths.proposedAddresses.submit({ crn }), 'POST'),
}
